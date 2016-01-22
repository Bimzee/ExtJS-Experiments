/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 * @class Sch.mixin.Lockable
 * @extends Ext.grid.locking.Lockable.
 * @private
 * This is a private class for internal use.
 */
Ext.define('Sch.mixin.Lockable', {
    extend                      : 'Ext.grid.locking.Lockable',
    
    useSpacer                   : true,

    syncRowHeight               : false,
    
    horizontalScrollForced      : false,

    // overridden
    // @OVERRIDE
    injectLockable: function () {

        var me          = this;
        var isTree      = Ext.data.TreeStore && me.store instanceof Ext.data.TreeStore;

        var eventSelModel = me.getEventSelectionModel ? me.getEventSelectionModel() : me.getSelectionModel();

        // Make local copies of these configs in case someone puts them on the prototype of a subclass.
        me.lockedGridConfig = Ext.apply({}, me.lockedGridConfig || {});
        me.normalGridConfig = Ext.apply({}, me.schedulerConfig || me.normalGridConfig || {});

        if (me.lockedXType) {
            me.lockedGridConfig.xtype = me.lockedXType;
        }

        if (me.normalXType) {
            me.normalGridConfig.xtype = me.normalXType;
        }

        var lockedGrid = me.lockedGridConfig,
            normalGrid = me.normalGridConfig;

        // Configure the child grids
        Ext.applyIf(me.lockedGridConfig, {
            useArrows           : true,
            split               : true,
            animCollapse        : false,
            collapseDirection   : 'left',
            trackMouseOver      : false,
            region              : 'west'
        });

        Ext.applyIf(me.normalGridConfig, {
            viewType            : me.viewType,

            layout              : 'fit',

            sortableColumns     : false,
            enableColumnMove    : false,
            enableColumnResize  : false,
            enableColumnHide    : false,
            trackMouseOver      : false,

            /* @COMPAT 2.2 */
            getSchedulingView   : function() {
                var con = typeof console !== "undefined" ? console : false;

                if (con && con.log) con.log('getSchedulingView is deprecated on the inner grid panel. Instead use getView on the "normal" subgrid.');

                return this.getView();
            },

            selModel            : eventSelModel,

            collapseDirection   : 'right',
            animCollapse        : false,
            region              : 'center'
        });

        if (me.mode === 'vertical') {
            lockedGrid.store = normalGrid.store = me.timeAxis;
        }

        if (lockedGrid.width) {
            // User has specified a fixed width for the locked section, disable the syncLockedWidth method
            me.syncLockedWidth = Ext.emptyFn;
            // Enable scrollbars for locked section
            lockedGrid.scroll = 'horizontal';
            lockedGrid.scrollerOwner = true;
        }

        var lockedViewConfig    = me.lockedViewConfig = me.lockedViewConfig || {};
        var normalViewConfig    = me.normalViewConfig = me.normalViewConfig || {};

        if (isTree) {
            // HACK, speeding up by preventing an edit to cause a massive relayout
            var oldOnUpdate = Ext.tree.View.prototype.onUpdate;
            lockedViewConfig.onUpdate = function() {
                // truncated version of original "refreshSize" which does not do any layouts, but which however still
                // should update the reference of the "body" element
                this.refreshSize = function () {
                    var me = this,
                        bodySelector = me.getBodySelector();

                    // On every update of the layout system due to data update, capture the view's main element in our private flyweight.
                    // IF there *is* a main element. Some TplFactories emit naked rows.
                    if (bodySelector) {
                        me.body.attach(me.el.child(bodySelector, true));
                    }
                };
                Ext.suspendLayouts();
                oldOnUpdate.apply(this, arguments);
                Ext.resumeLayouts();
                this.refreshSize = Ext.tree.View.prototype.refreshSize;
            };

            if (Ext.versions.extjs.isLessThan('5.0')) {
                // need to use the NodeStore instance, created in the FilterableTreeStore mixin for both views
                lockedViewConfig.store  = normalViewConfig.store = me.store.nodeStore;
            }
        }

        var origLayout = me.layout;
        var lockedWidth = lockedGrid.width;

        this.callParent(arguments);

        // HACK, no sane way of getting rid of these it seems (as of 4.2.1).
        // Grouping view overwrites showMenuBy property
        // http://www.sencha.com/forum/showthread.php?269612-Config-to-get-rid-of-Lock-Unlock-column-options&p=987653#post987653
        this.on('afterrender', function() {
            var showMenuBy = this.lockedGrid.headerCt.showMenuBy;

            this.lockedGrid.headerCt.showMenuBy = function() {
                showMenuBy.apply(this, arguments);

                me.showMenuBy.apply(this, arguments);
            };
        });

        // At this point, the 2 child grids are created

        var lockedView = me.lockedGrid.getView();
        var normalView = me.normalGrid.getView();

        this.patchViews();

        // Now post processing, changing and overriding some things that Ext.grid.Lockable sets up
        if (lockedWidth || origLayout === 'border') {
            if (lockedWidth) {
                me.lockedGrid.setWidth(lockedWidth);
            }

            // Force horizontal scrollbar to be shown to keep spacerEl magic working when scrolling to bottom
            normalView.addCls('sch-timeline-horizontal-scroll');
            lockedView.addCls('sch-locked-horizontal-scroll');
            
            me.horizontalScrollForced   = true;
        }

        if (me.normalGrid.collapsed) {
            // Need to workaround this, child grids cannot be collapsed initially
            me.normalGrid.collapsed = false;

            // Note, for the case of buffered view/store we need to wait for the view box to be ready before collapsing
            // since the paging scrollbar reads the view height during setup. When collapsing too soon, its viewSize will be 0.
            normalView.on('boxready', function(){
                me.normalGrid.collapse();
            }, me, { delay : 10 });
        }

        if (me.lockedGrid.collapsed) {
            if (lockedView.bufferedRenderer) lockedView.bufferedRenderer.disabled = true;
        }

        // Without this fix, scrolling on Mac Chrome does not work in locked grid
        if (Ext.getScrollbarSize().width === 0) {
            // https://www.assembla.com/spaces/bryntum/support/tickets/252
            lockedView.addCls('sch-ganttpanel-force-locked-scroll');
        }

        if (isTree) {
            this.setupLockableTree();
        }

        if (me.useSpacer) {
            normalView.on('refresh', me.updateSpacer, me);
            lockedView.on('refresh', me.updateSpacer, me);
        }

        if (origLayout !== 'fit') {
            me.layout = origLayout;
        }

        // @OVERRIDE using some private methods to sync the top scroll position for a locked grid which is initially collapsed
        if (normalView.bufferedRenderer) {
            // Need to sync vertical position after child gridpanel expand
            this.lockedGrid.on('expand', function() {
                lockedView.el.dom.scrollTop     = normalView.el.dom.scrollTop;
            });

            this.patchSubGrid(this.lockedGrid, true);
            this.patchSubGrid(this.normalGrid, false);

            this.patchBufferedRenderingPlugin(normalView.bufferedRenderer);
            this.patchBufferedRenderingPlugin(lockedView.bufferedRenderer);
        }


        // Patch syncHorizontalScroll to solve header scroll issue
        this.patchSyncHorizontalScroll(this.lockedGrid);
        this.patchSyncHorizontalScroll(this.normalGrid);
        
        this.delayReordererPlugin(this.lockedGrid);
        this.delayReordererPlugin(this.normalGrid);
        
        this.fixHeaderResizer(this.lockedGrid);
        this.fixHeaderResizer(this.normalGrid);
    },


    setupLockableTree: function () {
        var me              = this;
        var lockedView      = me.lockedGrid.getView();

        // enable filtering support for trees
        var filterableProto = Sch.mixin.FilterableTreeView.prototype;

        lockedView.initTreeFiltering        = filterableProto.initTreeFiltering;
        lockedView.onFilterChangeStart      = filterableProto.onFilterChangeStart;
        lockedView.onFilterChangeEnd        = filterableProto.onFilterChangeEnd;
        lockedView.onFilterCleared          = filterableProto.onFilterCleared;
        lockedView.onFilterSet              = filterableProto.onFilterSet;

        lockedView.initTreeFiltering();
    },

    
    patchSyncHorizontalScroll : function(grid) {
        // Override scrollTask
        grid.scrollTask = new Ext.util.DelayedTask(function (left, setBody) {
            // Patched method, always get scroll left position from dom, not from args
            // http://www.sencha.com/forum/showthread.php?273464-Grid-panel-header-scrolls-incorrectly-after-column-resizing
            // test: header/318_header_scroll_bug.t.js
            var target = this.getScrollTarget().el;

            if (target) this.syncHorizontalScroll(target.dom.scrollLeft, setBody);
        }, grid);
    },
    
    
    // the columns re-orderer plugin is being initialized synchronously, after rendering the header container
    // but before layouts
    // its initializing involves creation of drag/drop zones which performs "verifyEl" call on the headerCt element
    // which, in turn, tries to access "el.offsetParent" - that slows down rendering for no reason.
    // the initilization of the column reoderer can be delayed.
    // for 700 tasks / 300 dependencies project this optimization brings rendering time down from 3s to 2.5s in Chrome
    // (for other browsers speed up is less significant)
    delayReordererPlugin : function (grid) {
        var headerCt                = grid.headerCt;
        var reorderer               = headerCt.reorderer;
        
        if (reorderer) {
            headerCt.un('render', reorderer.onHeaderCtRender, reorderer);
            headerCt.on('render', function () {
                if (!headerCt.isDestroyed) reorderer.onHeaderCtRender(); 
            }, reorderer, { single : true, delay : 10 });
        }
    },
    
    // reproducible in Firefox and IE
    // a fix for weird problem in header resizer, which can be reproduced with the following steps in the vertical example, scheduler
    // t.chain([{"click":[547,154]},{"rightclick":[975,482]},{"doubleclick":[215,126]},{"rightclick":[405,141]},{"action":"drag","target":[291,575],"to":[987,289]},{"action":"drag","target":[781,205],"to":[512,599]},{"rightclick":[731,387]},{"rightclick":[299,236]},{"rightclick":[1014,164]},{"click":[59,180]}])
    // it is reproducible with real mouse too, just a bit harder, as cursor need to barely touch the Mike column
    // problem is that after mode change "dragHd" property of the resizer remains the same and keeps reference to the column
    // from previous mode ("mousedown" is triggered before "mousemove"? or something like that)
    // that column is already destroyed and not part of the component tree, so resizer throws exception
    fixHeaderResizer : function (grid) {
        var headerCt                = grid.headerCt;
        var resizer                 = headerCt.resizer;
        
        if (resizer) {
            var prevOnBeforeStart   = resizer.onBeforeStart;
            
            resizer.onBeforeStart   = function () {
                if (this.activeHd && this.activeHd.isDestroyed) return false;
                
                return prevOnBeforeStart.apply(this, arguments);
            };
        }
    },

    
    updateSpacer : function() {

        var lockedView = this.lockedGrid.getView();
        var normalView = this.normalGrid.getView();

        if (lockedView.rendered && normalView.rendered && lockedView.el.child('table')) {
            var me   = this,
            // This affects scrolling all the way to the bottom of a locked grid
            // additional test, sort a column and make sure it synchronizes
                lockedViewEl   = lockedView.el,
                normalViewEl = normalView.el.dom,
                spacerId = lockedViewEl.dom.id + '-spacer',
                spacerHeight = (normalViewEl.offsetHeight - normalViewEl.clientHeight) + 'px';

            me.spacerEl = Ext.getDom(spacerId);

            // HACK ie 6-7 and 8 in quirks mode fail to set style of hidden elements, so we must remove it manually
            if (Ext.isIE6 || Ext.isIE7 || (Ext.isIEQuirks && Ext.isIE8) && me.spacerEl) {

                Ext.removeNode(me.spacerEl);
                me.spacerEl = null;
            }

            if (me.spacerEl) {
                me.spacerEl.style.height = spacerHeight;
            } else {
                // put the spacer inside of stretcher with special css class (see below), which will cause the
                // stretcher to increase its height on the height of spacer
                var spacerParent = lockedViewEl;

                Ext.core.DomHelper.append(spacerParent, {
                    id      : spacerId,
//                    cls     : this.store.buffered ? 'sch-locked-buffered-spacer' : '',
                    style   : 'height: ' + spacerHeight
                });
            }
        }
    },


    // TODO remove after dropping support for 4.2.0?
    onLockedViewScroll: function() {
        this.callParent(arguments);

        var lockedBufferedRenderer  = this.lockedGrid.getView().bufferedRenderer;

        if (lockedBufferedRenderer) lockedBufferedRenderer.onViewScroll();
    },

    // TODO remove after dropping support for 4.2.0?
    onNormalViewScroll: function() {
        this.callParent(arguments);

        var normalBufferedRenderer  = this.normalGrid.getView().bufferedRenderer;

        if (normalBufferedRenderer) normalBufferedRenderer.onViewScroll();
    },


    // this method should been called "patchSubGridWhenBufferedRendererIsEnabled", it assumes `bufferedRenderer` presents
    patchSubGrid : function (grid, isLocked) {
        var view                    = grid.getView();
        var bufferedRenderer        = view.bufferedRenderer;

        // we need to disable the buffered renderer plugin when grid is collapsed
        grid.on({
            collapse        : function () { bufferedRenderer.disabled = true; },
            expand          : function () { bufferedRenderer.disabled = false; }
        });
        
        // bug in ExtJS: http://www.sencha.com/forum/showthread.php?276800-4.2.2-Buffered-rendering-plugin-issues&p=1013797#post1013797
        // the `tableStyle` misses "px" at the end
        var prevCollectData         = view.collectData;
        
        view.collectData            = function () {
            var result              = prevCollectData.apply(this, arguments);
            var tableStyle          = result.tableStyle;
            
            // checking if `tableStyle` ends with "px" (trying to do it fast)
            if (tableStyle && tableStyle[ tableStyle.length - 1 ] != 'x') result.tableStyle += 'px';
            
            return result;
        };
        // eof bug
        
        // onRemove patch
        // in case of tree, normal and locked views have different types - locked view is a tree view and normal view is a regular
        // grid view. This causes the buffered rendererers, attached to the views,  behave differently, because of 
        // Ext.grid.plugin.BufferedRendererTreeView override.
        // When some node is collapsed for example, the locked view is fully refreshed (not sure why the full refresh is needed)
        // after refresh the "onViewRefresh" method of the buffered renderer is called for the locked view
        // and it updates the stretcher size among other things
        // but, this method is not called for normal grid, because its a regular grid view, w/o Ext.grid.plugin.BufferedRendererTreeView
        // so we call that method manually
        var isTree                  = Ext.data.TreeStore && this.store instanceof Ext.data.TreeStore;
        
//        if (isLocked && isTree) {
//            var prevOnRemove        = view.onRemove;
//            
//            view.onRemove           = function () {
//                prevOnRemove.apply(this, arguments);
//                
//                this.lockingPartner.bufferedRenderer.onViewRefresh();
//            };
//            
//            // we will need re-bind the store, that will happen at the bottom of the method
//        }
        
        // this store is one we need to change listeners for
        // fix for ticket #1390, tests: 1020, 203_buffered_view_5 in gantt
        var store               = view.getStore();
        
        if (!isLocked && isTree) {
            var prevOnRemove        = view.onRemove;
            
            store.un('bulkremove', view.onRemove, view);
            
            view.onRemove           = function () {
                var me = this;
                // Using buffered rendering - removal (eg folder node collapse)
                // Has to refresh the view
                if (me.rendered && me.bufferedRenderer) {
                    me.refreshView();
                }
                // No BufferedRenderer preent
                else {
                    prevOnRemove.apply(this, arguments);
                }
            };
            
            store.on('bulkremove', view.onRemove, view);
        }
        // eof onRemove patch
        
        // The buffered renderer plugin includes 2 overrides for grid view: Ext.grid.plugin.BufferedRendererTableView and 
        // Ext.grid.plugin.BufferedRendererTreeView.
        // Seems the buffered renderer behavior is completely broken when doing CRUD with the store (nodes are inserted in
        // random places in the view), that is why Ext.grid.plugin.BufferedRendererTreeView modestly does a full refresh 
        // for a "onRemove" handler. We will do the same for "onAdd" and for regular table as well.
        var prevOnAdd               = view.onAdd;
        
        store.un('add', view.onAdd, view);
        
        view.onAdd                  = function () {
            var me = this;
            // Using buffered rendering - removal (eg folder node collapse)
            // Has to refresh the view
            if (me.rendered && me.bufferedRenderer) {
                me.refreshView();
            }
            // No BufferedRenderer preent
            else {
                prevOnAdd.apply(this, arguments);
            }
        };
        
        store.on('add', view.onAdd, view);
    },
    
    
    afterLockedViewLayout : function () {
        // do nothing if horizontal scrolling has been forced
        // this method performs some bottom border with adjustment
        // which we don't need in case of forced scrolling
        if (!this.horizontalScrollForced) return this.callParent(arguments);
    },


    patchBufferedRenderingPlugin : function (plugin) {
        plugin.variableRowHeight    = true;

        if (Ext.getVersion('extjs').isLessThan('4.2.1.883')) {
            // TODO find more robust way to unsubscribe from "scroll" event of the view
            plugin.view.on('afterrender', function () {
                plugin.view.el.un('scroll', plugin.onViewScroll, plugin);
            }, this, { single : true, delay : 1 });

            var prevStretchView         = plugin.stretchView;

            plugin.stretchView          = function (view, scrollRange) {
                var me              = this,
                    recordCount     = (me.store.buffered ? me.store.getTotalCount() : me.store.getCount());

                if (recordCount && (me.view.all.endIndex === recordCount - 1)) {
                    scrollRange     = me.bodyTop + view.body.dom.offsetHeight;
                }

                prevStretchView.apply(this, [ view, scrollRange ]);
            };
        } else {
            var prevEnable          = plugin.enable;

            plugin.enable           = function () {
                if (plugin.grid.collapsed) return;

                return prevEnable.apply(this, arguments);
            };
        }
        
        // this event is required for cell plugin to update itself
        var oldFunc = plugin.onRangeFetched;
        plugin.onRangeFetched = function () {
            oldFunc.apply(plugin, arguments);
            plugin.view.fireEvent('rangefetched', plugin, arguments);
        };
    },

    // HACK, no sane way of getting rid of these it seems (as of 4.2.1).
    // http://www.sencha.com/forum/showthread.php?269612-Config-to-get-rid-of-Lock-Unlock-column-options&p=987653#post987653
    showMenuBy: function(t, header) {
        var menu = this.getMenu(),
            unlockItem  = menu.down('#unlockItem'),
            lockItem = menu.down('#lockItem'),
            sep = unlockItem.prev();

        sep.hide();
        unlockItem.hide();
        lockItem.hide();
    },

    // Various ugly overrides to avoid locked grid causing crazy scrolling in IE.
    // REMOVE FOR EXT 5, UNTIL THEN - ENJOY
    patchViews : function() {
        if (Ext.isIE) {
            var selModel    = this.getSelectionModel();
            var me          = this;
            var lockedView  = me.lockedGrid.view;
            var normalView  = me.normalGrid.view;

            //@OVERRIDE to fix https://www.assembla.com/spaces/bryntum/tickets/661
            // https://www.assembla.com/spaces/bryntum/tickets/1095
            var old         = selModel.processSelection;
            
            var eventName   = Ext.getVersion('extjs').isLessThan('4.2.2.1144') ? 'mousedown' : 'click';
            var focusMethod = lockedView.doFocus ? 'doFocus' : 'focus';
            
            selModel.processSelection = function (view, record, item, index, e) {
                var oldScrollRowIntoView, oldFocus;

                if (e.type == eventName) {
                    oldScrollRowIntoView            = lockedView.scrollRowIntoView;
                    oldFocus                        = lockedView[ focusMethod ];

                    lockedView.scrollRowIntoView    = normalView.scrollRowIntoView = Ext.emptyFn;
                    lockedView[ focusMethod ]       = normalView[ focusMethod ] = Ext.emptyFn;
                }

                old.apply(this, arguments);

                if (e.type == eventName) {
                    lockedView.scrollRowIntoView    = normalView.scrollRowIntoView = oldScrollRowIntoView;
                    lockedView[ focusMethod ]       = normalView[ focusMethod ] = oldFocus;
                    
                    lockedView.el.focus();
                }
            };

            //@OVERRIDE to fix https://www.assembla.com/spaces/bryntum/tickets/661
            var oldRF = normalView.onRowFocus;

            normalView.onRowFocus = function (rowIdx, highlight, suppressFocus) {
                oldRF.call(this, rowIdx, highlight, true);
            };
            
//            var oldNormalFocusRow   = normalView.focusRow;
//            normalView.focusRow = function (row, delay) { return oldNormalFocusRow.call(this, row, 0) };
//
//            var oldLockedFocusRow   = lockedView.focusRow;
//            lockedView.focusRow = function (row, delay) { return oldLockedFocusRow.call(this, row, 0) };
            
            if (Ext.tree && Ext.tree.plugin && Ext.tree.plugin.TreeViewDragDrop) {

                lockedView.on('afterrender', function() {
                    Ext.each(lockedView.plugins, function(plug) {

                        if (plug instanceof Ext.tree.plugin.TreeViewDragDrop && plug.dragZone) {

                            var old = lockedView[ focusMethod ];

                            plug.dragZone.view.un('itemmousedown', plug.dragZone.onItemMouseDown, plug.dragZone);

                            plug.dragZone.view.on('itemmousedown', function() {

                                lockedView[ focusMethod ] = Ext.emptyFn;

                                if (lockedView.editingPlugin) {
                                    lockedView.editingPlugin.completeEdit();
                                }
                                plug.dragZone.onItemMouseDown.apply(plug.dragZone, arguments);

                                lockedView[ focusMethod ] = old;
                            });

                            return false;
                        }
                    });

                }, null, { delay : 100 });
            }
        }
    }
});

/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

 @class Sch.mixin.TimelinePanel
 @extends Sch.mixin.AbstractTimelinePanel
 A base mixing for {@link Ext.panel.Panel} classes, giving to the consuming panel the "time line" functionality.
 This means that the panel will be capabale to display a list of "events", ordered on the {@link Sch.data.TimeAxis time axis}.

 Generally, should not be used directly, if you need to subclass the scheduler panel, subclass the {@link Sch.panel.SchedulerGrid} or {@link Sch.panel.SchedulerTree}
 instead.

*/

if (!Ext.ClassManager.get("Sch.mixin.TimelinePanel")) {

Ext.define('Sch.mixin.TimelinePanel', {
    extend : 'Sch.mixin.AbstractTimelinePanel',

    requires: [
        'Sch.util.Patch',

        'Sch.patches.ElementScroll',
        'Sch.column.timeAxis.Horizontal',
        'Sch.preset.Manager'
    ],

    mixins: [
        'Sch.mixin.Zoomable',
        'Sch.mixin.Lockable'
    ],

    /**
    * @cfg {Object} lockedGridConfig A custom config object used to initialize the left (locked) grid panel.
    */

    /**
    * @cfg {Object} schedulerConfig A custom config object used to initialize the right (schedule) grid panel.
    */

    /**
    * @cfg {Ext.Template} tooltipTpl
    * Template used to show a tooltip over a scheduled item, null by default (meaning no tooltip). The tooltip will be populated with the data in
    * record corresponding to the hovered element. See also {@link #tipCfg}.
    */

    /**
     * @cfg {Sch.mixin.TimelinePanel} partnerTimelinePanel A reference to another timeline panel that this panel should be 'partner' with.
     * If this config is supplied, this panel will:
     *
     * - Share and use the {@link Sch.data.TimeAxis} timeAxis from the partner panel.
     * - Synchronize the width of the two locked grid panels (after a drag of the splitter).
     * - Synchronize horizontal scrolling between two panels.
     */

    /**
     * @cfg {Number} bufferCoef
     *
     * This config defines the width of the left and right invisible parts of the timespan when {@link #infiniteScroll} set to `true`.
     *
     * It should be provided as a coefficient, which will be multiplied by the width of the scheduling area.
     *
     * For example, if `bufferCoef` is `5` and the panel view width is 200px then the timespan will be calculated to
     * have approximately 1000px (`5 * 200`) to the left and 1000px to the right of the visible area, resulting
     * in 2200px of totally rendered content.
     *
     * The timespan gets recalculated when the scroll position reaches the limits defined by the {@link #bufferThreshold} option.
     *
     */
    bufferCoef                  : 5,

    /**
     * @cfg {Number} bufferThreshold
     *
     * This config defines the horizontal scroll limit, which, when exceeded will cause a timespan shift.
     * The limit is calculated as the `panelWidth * {@link #bufferCoef} * bufferThreshold`. During scrolling, if the left or right side
     * has less than that of the rendered content - a shift is triggered.
     *
     * For example if `bufferCoef` is `5` and the panel view width is 200px and `bufferThreshold` is 0.2, then the timespan
     * will be shifted when the left or right side has less than 200px (5 * 200 * 0.2) of content.
     */
    bufferThreshold             : 0.2,

    /**
     * @cfg {Boolean} infiniteScroll
     *
     * True to automatically adjust the panel timespan during horizontal scrolling, when the scroller comes close to the left/right edges.
     *
     * The actually rendered timespan in this mode (and thus the amount of HTML in the DOM) is calculated based
     * on the {@link #bufferCoef} option. The moment when the timespan shift happens is determined by the {@link #bufferThreshold} value.
     */
    infiniteScroll              : false,

    /**
     * @cfg {Boolean} showCrudManagerMask set this to true to display a load mask during CRUD manager server requests. Note: works only if {@link #crudManager} is specified.
     */
    showCrudManagerMask         : true,

    waitingForAutoTimeSpan      : false,
    
    columnLinesFeature          : null,

    renderWaitListener          : null,

    /**
    * @cfg {Object} tipCfg
    * The {@link Ext.Tooltip} config object used to configure a tooltip (only applicable if tooltipTpl is set).
    */
    tipCfg: {
        cls: 'sch-tip',

        showDelay: 1000,
        hideDelay: 0,

        autoHide: true,
        anchor: 'b'
    },

    /**
     * @event timeheaderclick
     * Fires after a click on a time header cell
     * @param {Sch.view.HorizontalTimeAxis} column The column object
     * @param {Date} startDate The start date of the header cell
     * @param {Date} endDate The start date of the header cell
     * @param {Ext.EventObject} e The event object
     */

    /**
     * @event timeheaderdblclick
     * Fires after a double click on a time header cell
     * @param {Sch.view.HorizontalTimeAxis} column The column object
     * @param {Date} startDate The start date of the header cell
     * @param {Date} endDate The end date of the header cell
     * @param {Ext.EventObject} e The event object
     */

    /**
     * @event timeheadercontextmenu
     * Fires after a right click on a time header cell
     * @param {Sch.view.HorizontalTimeAxis} column The column object
     * @param {Date} startDate The start date of the header cell
     * @param {Date} endDate The start date of the header cell
     * @param {Ext.EventObject} e The event object
     */


    /**
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:

     - loadingText : 'Loading, please wait...'
     - savingText : 'Saving changes, please wait...'
     */

    inheritables: function() {

        return {
            // Configuring underlying table panel
            columnLines         : true,
            enableLocking       : true,
            lockable            : true,
            stateEvents         : ['viewchange'],

            // EOF: Configuring underlying table panel

            // private
            initComponent: function () {
                if (this.partnerTimelinePanel) {
                    this.timeAxisViewModel = this.partnerTimelinePanel.timeAxisViewModel;
                    this.timeAxis   = this.partnerTimelinePanel.getTimeAxis();
                    this.startDate  = this.timeAxis.getStart();
                    this.endDate    = this.timeAxis.getEnd();
                }

                // @COMPAT 2.2
                if (this.viewConfig && this.viewConfig.forceFit) this.forceFit = true;

                if (Ext.versions.extjs.isGreaterThanOrEqual("4.2.1")) {
                    this.cellTopBorderWidth = 0;
                }
                
//                // for infinite scroll we turn timeaxis auto adjustment to get exact timeaxis.start date
//                // as a first left visible date tick
//                if (this.infiniteScroll) {
//                    this.autoAdjustTimeAxis     = false;
//                }                

                this._initializeTimelinePanel();

                this.configureColumns();
                
                var viewConfig      = this.normalViewConfig = this.normalViewConfig || {};
                var id              = this.getId();

                // Copy some properties to the view instance
                Ext.apply(this.normalViewConfig, {
                    id                      : id + '-timelineview',
                    eventPrefix             : this.autoGenId ? null : id,
                    timeAxisViewModel       : this.timeAxisViewModel,
                    eventBorderWidth        : this.eventBorderWidth,
                    timeAxis                : this.timeAxis,
                    readOnly                : this.readOnly,
                    mode                    : this.mode,
                    rtl                     : this.rtl,
                    cellBorderWidth         : this.cellBorderWidth,
                    cellTopBorderWidth      : this.cellTopBorderWidth,
                    cellBottomBorderWidth   : this.cellBottomBorderWidth,
                    infiniteScroll          : this.infiniteScroll,
                    bufferCoef              : this.bufferCoef,
                    bufferThreshold         : this.bufferThreshold
                });

                Ext.Array.forEach(
                    [
                        "eventRendererScope",
                        "eventRenderer",
                        "dndValidatorFn",
                        "resizeValidatorFn",
                        "createValidatorFn",
                        "tooltipTpl",
                        "validatorFnScope",
                        "eventResizeHandles",
                        "enableEventDragDrop",
                        "enableDragCreation",
                        "resizeConfig",
                        "createConfig",
                        "tipCfg",
                        "getDateConstraints"
                    ],
                    function(prop) {
                      if (prop in this) viewConfig[prop] = this[prop];
                    },
                    this
                );

                this.callParent(arguments);
                
                var me = this;
                
                if (this.normalGrid.forceFit) {
                    this.normalGrid.on('resize', function (grid, width) {
                        // in order to render events correctly we have to memorize column width here
                        if (me.getMode() === 'calendar') {
                            var columns = grid.query('gridcolumn');
                            me.timeAxisViewModel.setViewColumnWidth((width - 17) / columns.length, true);
                        }
                    });
                }

                this.switchViewPreset(this.viewPreset, this.startDate || this.timeAxis.getStart(), this.endDate || this.timeAxis.getEnd(), true);
                
                // if no start/end dates specified let's get them from event store
                if (!this.startDate) {
                    var store       = this.getTimeSpanDefiningStore();

                    // if events already loaded
                    if (Ext.data.TreeStore && store instanceof Ext.data.TreeStore ? store.getRootNode().childNodes.length : store.getCount()) {
                        this.applyStartEndDatesFromStore();
                    } else {
                        this.bindAutoTimeSpanListeners();
                    }
                }

                var columnLines     = this.columnLines;

                if (columnLines) {
                    this.columnLinesFeature = new Sch.feature.ColumnLines(Ext.isObject(columnLines) ? columnLines : undefined);
                    this.columnLinesFeature.init(this);

                    this.columnLines    = true;
                }

                this.relayEvents(this.getSchedulingView(), [
                    /**
                    * @event beforetooltipshow
                    * Fires before the event tooltip is shown, return false to suppress it.
                    * @param {Sch.mixin.TimelinePanel} scheduler The scheduler object
                    * @param {Sch.model.Event} eventRecord The event record of the clicked record
                    */
                    'beforetooltipshow'
                ]);

                this.on('afterrender', this.__onAfterRender, this);

                // HACK, required since Ext has an async scroll sync mechanism setup which won't play nice with our "sync scroll" above.
                this.on('zoomchange', function() {
                    // After a zoom, the header is resized and Ext JS TablePanel reacts to the size change.
                    // Ext JS reacts after a short delay, so we cancel this task to prevent Ext from messing up the scroll sync
                    this.normalGrid.scrollTask.cancel();
                });

                // if we have CrudManager instance assigned, we should show and hide a load mask
                // But not with autoSync enabled, since that'll be a terrible user experience
                if (this.crudManager && !this.crudManager.autoSync && this.showCrudManagerMask) {
                    this.mon(this.crudManager, {
                        beforesend      : this.beforeCrudOperationStart,

                        synccanceled    : this.onCrudOperationComplete,
                        loadcanceled    : this.onCrudOperationComplete,
                        load            : this.onCrudOperationComplete,
                        sync            : this.onCrudOperationComplete,
                        loadfail        : this.onCrudOperationComplete,
                        syncfail        : this.onCrudOperationComplete,

                        scope           : this
                    });

                    // User might already have triggered a load operation
                    if (this.crudManager.isLoading()) {
                        this.beforeCrudOperationStart(this.crudManager, null, 'load');
                    }
                }
            },

            getState: function () {
                var me = this,
                    state = me.callParent(arguments);

                Ext.apply(state, {
                    viewPreset      : me.viewPreset,
                    startDate       : me.getStart(),
                    endDate         : me.getEnd(),
                    zoomMinLevel    : me.zoomMinLevel,
                    zoomMaxLevel    : me.zoomMaxLevel,
                    currentZoomLevel: me.currentZoomLevel
                });
                return state;
            },

            applyState: function (state) {
                var me = this;

                me.callParent(arguments);

                if (state && state.viewPreset) {
                    me.switchViewPreset(state.viewPreset, state.startDate, state.endDate);
                }
                if (state && state.currentZoomLevel){
                    me.zoomToLevel(state.currentZoomLevel);
                }
            },

            setTimeSpan : function () {
                if (this.waitingForAutoTimeSpan) {
                    this.unbindAutoTimeSpanListeners();
                }

                this.callParent(arguments);

                // if view was not initialized due to our refresh stopper the onTimeAxisViewModelUpdate method will not do a refresh
                // if that happened we do refresh manually
                if (!this.normalGrid.getView().viewReady) {
                    this.getView().refresh();
                }
            }
        };
    },


    bindAutoTimeSpanListeners : function () {
        var store                           = this.getTimeSpanDefiningStore();

        this.waitingForAutoTimeSpan         = true;

        // prevent panel refresh till eventStore gets loaded
        this.normalGrid.getView().on('beforerefresh', this.refreshStopper, this);
        this.lockedGrid.getView().on('beforerefresh', this.refreshStopper, this);

        this.mon(store, 'load', this.applyStartEndDatesFromStore, this);

        if (Ext.data.TreeStore && store instanceof Ext.data.TreeStore) {
            this.mon(store, 'rootchange', this.applyStartEndDatesFromStore, this);
            this.mon(store.tree, 'append', this.applyStartEndDatesAfterTreeAppend, this);

        } else {
            this.mon(store, 'add', this.applyStartEndDatesFromStore, this);
        }
    },


    refreshStopper : function (view) {
        return view.store.getCount() === 0;
    },


    getTimeSpanDefiningStore : function () {
        throw "Abstract method called";
    },

    unbindAutoTimeSpanListeners : function () {
        this.waitingForAutoTimeSpan = false;

        var store   = this.getTimeSpanDefiningStore();

        // allow panel refresh back
        this.normalGrid.getView().un('beforerefresh', this.refreshStopper, this);
        this.lockedGrid.getView().un('beforerefresh', this.refreshStopper, this);

        // unbind listener
        store.un('load', this.applyStartEndDatesFromStore, this);

        if (Ext.data.TreeStore && store instanceof Ext.data.TreeStore) {
            store.un('rootchange', this.applyStartEndDatesFromStore, this);
            store.tree.un('append', this.applyStartEndDatesAfterTreeAppend, this);
        } else {
            store.un('add', this.applyStartEndDatesFromStore, this);
        }
    },


    applyStartEndDatesAfterTreeAppend : function () {
        var store   = this.getTimeSpanDefiningStore();

        // Need to block the reading of the total store timespan until the store is done loading
        // With CRUD manager, we need the __loading flag since multiple append events are fired during load
        if (!store.isSettingRoot && !store.__loading) {
            this.applyStartEndDatesFromStore();
        }
    },


    applyStartEndDatesFromStore : function() {
        var store   = this.getTimeSpanDefiningStore();
        var span    = store.getTotalTimeSpan();

        var prev    = this.lockedGridDependsOnSchedule;

        // If event store contains events without duration, add a 1 mainUnit buffer to each side
        if (span.end && span.start && span.end - span.start === 0) {
            span.start = Sch.util.Date.add(span.start, this.timeAxis.mainUnit, -1);
            span.end   = Sch.util.Date.add(span.end, this.timeAxis.mainUnit, 1);
        }

        this.lockedGridDependsOnSchedule    = true;
        this.setTimeSpan(span.start || new Date(), span.end);
        this.lockedGridDependsOnSchedule    = prev;
    },


    onLockedGridItemDblClick : function(grid, record, el, rowIndex, event){
        if(this.mode === 'vertical' && record) {
            this.fireEvent('timeheaderdblclick', this, record.get('start'), record.get('end'), rowIndex, event);
        }
    },

    /**
    * Returns the view which renders the schedule and time columns. This method should be used instead of the usual `getView`,
    * since `getView` will return an instance of a special "locking" grid view, which has no scheduler-specific features.
    *
    * @return {Sch.mixin.SchedulerView} view A view implementing the {@link Sch.mixin.SchedulerView} mixin
    */
    getSchedulingView: function () {
        return this.normalGrid.getView();
    },

    getTimeAxisColumn : function () {
        if (!this.timeAxisColumn) {
            this.timeAxisColumn = this.down('timeaxiscolumn');
        }

        return this.timeAxisColumn;
    },

    configureColumns : function() {

        var columns         = this.columns || [];

        // The 'columns' config can also be a config object for Ext.grid.header.Container
        if (columns.items) {
            columns = columns.items;
        } else {
            // Clone it to make sure we handle the case of a column array object put on the class prototype
            columns = this.columns = columns.slice();
        }

        var lockedColumns   = [];
        var normalColumns   = [];

        // Split locked and normal columns first
        Ext.Array.each(columns, function (column) {
            if (column.position === 'right') {
                if (!Ext.isNumber(column.width)) {
                    Ext.Error.raise('"Right" columns must have a fixed width');
                }
                column.locked = false;

                normalColumns.push(column);
            } else {
                column.locked = true;
                lockedColumns.push(column);
            }
            column.lockable = false;
        });

        Ext.Array.erase(columns, 0, columns.length);
        Ext.Array.insert(columns, 0, lockedColumns.concat(
            {
                xtype                   : 'timeaxiscolumn',
                timeAxisViewModel       : this.timeAxisViewModel,
                trackHeaderOver         : this.trackHeaderOver,
                renderer                : this.mainRenderer,
                scope                   : this
            }
        ).concat(normalColumns));

        // Save reference to original set of columns
        this.horizontalColumns = Ext.Array.clone(columns);

        this.verticalColumns = [
            Ext.apply({
                xtype                   : 'verticaltimeaxis',
                width                   : 100,
                timeAxis                : this.timeAxis,
                timeAxisViewModel       : this.timeAxisViewModel,
                cellTopBorderWidth      : this.cellTopBorderWidth,
                cellBottomBorderWidth   : this.cellBottomBorderWidth
            }, this.timeAxisColumnCfg || {})
        ];
        
        this.calendarColumns = [
            Ext.apply({
                xtype                   : 'verticaltimeaxis',
                width                   : 60,
                timeAxis                : this.timeAxis,
                timeAxisViewModel       : this.timeAxisViewModel,
                cellTopBorderWidth      : this.cellTopBorderWidth,
                cellBottomBorderWidth   : this.cellBottomBorderWidth
            }, this.calendarTimeAxisCfg || {})
        ];

        if (this.mode === 'vertical') {
            this.columns    = this.verticalColumns.concat(this.createResourceColumns(this.resourceColumnWidth || this.timeAxisViewModel.resourceColumnWidth));
            this.store      = this.timeAxis;
        } else if (this.mode === 'calendar') {
            // in order to build columns/rows for calendar view we need time axis with view preset consumed
            // but axis is filled only after columns are initialized thus can be changed only via 'reconfigure' method
            // than requires grid to be rendered. 
            // We provide empty configs for columns and rows in order to make this procedure slightly faster
            // There is almost no other way untill timeaxis is filled before 'callParent' call.
            this.columns = [];
            this.store = null;
            this.on('afterrender', this.refreshCalendarColumns, this);
        }
    },


    mainRenderer : function(val, meta, rowRecord, rowIndex, colIndex) {
        var renderers       = this.renderers,
            isHorizontal    = this.mode === 'horizontal',
            resource        = this.mode === 'horizontal' || this.mode === 'calendar' ? rowRecord : this.resourceStore.getAt(colIndex),
            retVal          = '&nbsp;'; // To ensure cells always consume correct height

        // Ext doesn't clear the meta object between cells
        meta.rowHeight      = null;

        for (var i = 0; i < renderers.length; i++) {
            retVal          += renderers[i].fn.call(renderers[i].scope || this, val, meta, resource, rowIndex, colIndex) || '';
        }

        if (this.variableRowHeight) {
            // Set row height
            var view                = this.getSchedulingView();

            var defaultRowHeight    = this.timeAxisViewModel.getViewRowHeight();

            meta.style              = 'height:' + ((meta.rowHeight || defaultRowHeight) - view.cellTopBorderWidth - view.cellBottomBorderWidth) + 'px';
        }

        return retVal;
    },

    // Child grids sync code
    // ---------------------------------
    __onAfterRender: function () {
        var me = this;

        me.normalGrid.on({
            collapse    : me.onNormalGridCollapse,
            expand      : me.onNormalGridExpand,
            scope       : me
        });

        me.lockedGrid.on({
            collapse    : me.onLockedGridCollapse,
            itemdblclick: me.onLockedGridItemDblClick,
            scope       : me
        });

        if (me.lockedGridDependsOnSchedule) {
            me.normalGrid.getView().on('itemupdate', me.onNormalViewItemUpdate, me);
        }

        if (this.partnerTimelinePanel) {
            if (this.partnerTimelinePanel.rendered) {
                this.setupPartnerTimelinePanel();
            } else {
                this.partnerTimelinePanel.on('afterrender', this.setupPartnerTimelinePanel, this);
            }
        }
    },


    onLockedGridCollapse : function() {
        if (this.normalGrid.collapsed) {
            this.normalGrid.expand();
        }
    },

    onNormalGridCollapse : function() {
        var me = this;

        //Hack for Gantt to prevent creating second expander when normal grid initially collapsed
        if(!me.normalGrid.reExpander){
            me.normalGrid.reExpander = me.normalGrid.placeholder;
        }

        if (!me.lockedGrid.rendered) {
            me.lockedGrid.on('render', me.onNormalGridCollapse, me, { delay: 1 });
        } else {
            me.lockedGrid.flex = 1;
            me.lockedGrid.doLayout();

            if (me.lockedGrid.collapsed) {
                me.lockedGrid.expand();
            }

            // Show a vertical scrollbar in locked grid if normal grid is collapsed
            me.addCls('sch-normalgrid-collapsed');
        }
    },

    onNormalGridExpand : function() {
        this.removeCls('sch-normalgrid-collapsed');

        delete this.lockedGrid.flex;
        this.lockedGrid.doLayout();
    },


    onNormalViewItemUpdate: function (record, index, oldRowEl) {
        if (this.lockedGridDependsOnSchedule) {
            var lockedView = this.lockedGrid.getView();

            lockedView.suspendEvents();
            // we cannot trust 'index' argument it may be wrong in case of grouping feature enabled
            lockedView.refreshNode(lockedView.indexOf(record));
            lockedView.resumeEvents();
        }
    },

    setupPartnerTimelinePanel : function () {

        // Sync locked grids by listening for splitter resize events of both locked grids.
        var otherPanel = this.partnerTimelinePanel;
        var externalSplitter = otherPanel.down('splitter');
        var ownSplitter = this.down('splitter');

        if (externalSplitter) {
            externalSplitter.on('dragend', function() {
                this.lockedGrid.setWidth(otherPanel.lockedGrid.getWidth());
            }, this);
        }

        if (ownSplitter) {
            ownSplitter.on('dragend', function() {
                otherPanel.lockedGrid.setWidth(this.lockedGrid.getWidth());
            }, this);
        }

        var lockedWidth = otherPanel.isVisible() ? otherPanel.lockedGrid.getWidth() : otherPanel.lockedGrid.width;
        this.lockedGrid.setWidth(lockedWidth);

        // sync scrolling with external timeline panel
        var otherViewEl  = otherPanel.getSchedulingView().getEl(),
            ownViewEl = this.getSchedulingView().getEl();

        otherPanel.mon(ownViewEl, 'scroll', function (e, el) {
            otherViewEl.scrollTo('left', el.scrollLeft);
        });

        this.mon(otherViewEl, 'scroll', function (e, el) {
            ownViewEl.scrollTo('left', el.scrollLeft);
        });

        // Update the 'viewPreset' property manually since it's a public property of the TimelinePanel.
        this.on('viewchange', function () {
            otherPanel.viewPreset = this.viewPreset;
        }, this);

        otherPanel.on('viewchange', function () {
            this.viewPreset = otherPanel.viewPreset;
        }, this);
    },
    // EOF child grids sync code --------------------------

    beforeCrudOperationStart : function (manager, params, type) {
        if (this.rendered) {
            this.setLoading({
                msg : type === 'load' ? this.L('loadingText') : this.L('savingText')
            });
        } else {
            Ext.destroy(this.renderWaitListener);
            this.renderWaitListener = this.on('render', Ext.Function.bind(this.beforeCrudOperationStart, this, Array.prototype.slice.apply(arguments)), this, { delay : 1, destroyable : true });
        }
    },

    onCrudOperationComplete : function () {
        Ext.destroy(this.renderWaitListener);

        this.setLoading(false);
    }
}, function () {
    var MIN_EXT_VERSION = '4.2.1';

    Ext.apply(Sch, {
        /*VERSION*/
    });

    // DELETE THIS CHECK IF YOU WANT TO RUN AGAINST AN OLDER UNSUPPORTED EXT JS VERSION
    if (Ext.versions.extjs.isLessThan(MIN_EXT_VERSION)) {
        alert('The Ext JS version you are using needs to be updated to at least ' + MIN_EXT_VERSION);
    }
});


}
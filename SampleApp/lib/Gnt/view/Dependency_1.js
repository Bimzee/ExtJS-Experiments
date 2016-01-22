/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 * @class Gnt.view.Dependency
 * @extends Ext.util.Observable
 * Internal class handling the dependency related functionality.
 */
Ext.define("Gnt.view.Dependency", {
    extend      : "Ext.util.Observable",

    requires    : [
        'Gnt.feature.DependencyDragDrop',
        'Gnt.view.DependencyPainter'
    ],

    /**
     * @cfg {Number} lineWidth
     * The number of pixels for the line width (supported values are 1 or 2 pixels), defaults to 1.
     */
    lineWidth       : 1,

    /**
     * @cfg {Object} dragZoneConfig
     * A custom config object to pass on to configure the Ext.dd.DragZone instance used when creating new dependencies
     */
    dragZoneConfig  : null,

    /**
     * @cfg {Object} dropZoneConfig
     * A custom config object to pass on to configure the Ext.dd.DropZone instance used when creating new dependencies
     */
    dropZoneConfig  : null,

    /**
     * @cfg {String} dependencyPainterClass
     * @protected
     * The class used to determine how the dependencies are painted. Override this to your own custom class to take control over the
     * painting.
     */
    dependencyPainterClass      : "Gnt.view.DependencyPainter",

    containerEl     : null,
    ganttView       : null,
    painter         : null,
    taskStore       : null,
    store           : null,
    dnd             : null,
    lineTpl         : null,
    renderTimer     : null,

    enableDependencyDragDrop    : true,

    renderAllDepsBuffered       : false,

    dependencyCls               : 'sch-dependency',
    selectedCls                 : 'sch-dependency-selected',

    // private
    constructor: function (cfg) {
        this.callParent(arguments);

        var ganttView = this.ganttView;

        ganttView.on({
            refresh         : this.renderAllDependenciesBuffered,
            bufferedrefresh : this.renderAllDependenciesBuffered,
            itemupdate      : this.onTaskUpdated,

            scope           : this
        });

        this.bindTaskStore(ganttView.getTaskStore());
        this.bindDependencyStore(cfg.store);

        if (!this.lineTpl) {
            var rtl = this.rtl;
            var side = rtl ? 'right' : 'left';

            this.lineTpl = Ext.create("Ext.XTemplate",
                '<tpl for=".">' +
                    Ext.String.format(
                        '<tpl for="lineCoordinates">' +
                            // lineCls can be used to style the dependency lines
                            '<div class="{0} {[ parent.dependency.isHighlighted ? "{1}" : "" ]} {[values.x1==values.x2 ? "sch-dependency-line-v" : "sch-dependency-line-h"]} {lineCls} sch-dep-{parent.id} {0}-line {[this.getSuffixedCls(parent.cls, "-line")]}" ' +
                            'style="' + side + ':{[Math.min(values.x1, values.x2)]}px;top:{[Math.min(values.y1, values.y2)]}px;' +
                            'width:{[Math.abs(values.x1-values.x2)+' + this.lineWidth + ']}px;' +
                            'height:{[Math.abs(values.y1-values.y2)+' + this.lineWidth + ']}px">' +
                            '</div>' +
                        '</tpl>' +
                        '<div style="' + side + ':{[values.lineCoordinates[values.lineCoordinates.length - 1].x2]}px;top:{[values.lineCoordinates[values.lineCoordinates.length - 1].y2]}px" ' +
                            '   class="{0}-arrow-ct {0} {[ values.dependency.isHighlighted ? "{1}" : "" ]} sch-dep-{id} {[this.getSuffixedCls(values.cls, "-arrow-ct")]}">' +
                            '<img src="' + Ext.BLANK_IMAGE_URL + '" class="{0}-arrow {0}-arrow-{[this.getArrowDirection(values.lineCoordinates)]} {[this.getSuffixedCls(values.cls, "-arrow")]}" />' +
                        '</div>',
                        this.dependencyCls,
                        this.selectedCls
                    ) +
                '</tpl>',
                {
                    compiled: true,
                    disableFormats : true,
                    getArrowDirection: function (coords) {
                        var lastXY = coords[coords.length - 1];

                        if (lastXY.y2 < lastXY.y1) return 'up';

                        if (lastXY.x1 === lastXY.x2) {
                            return 'down';
                        } else if ((!rtl && lastXY.x1 > lastXY.x2) || (rtl && lastXY.x1 < lastXY.x2)) {
                            return 'left';
                        } else {
                            return 'right';
                        }
                    },

                    getSuffixedCls : function (cls, suffix) {
                        if (cls && cls.indexOf(' ') != -1)
                            return cls.replace(/^\s*(.*)\s*$/, '$1').split(/\s+/).join(suffix + ' ') + suffix;
                        else
                            return cls + suffix;
                    }
                }
            );
        }

        this.painter = Ext.create(this.dependencyPainterClass, Ext.apply({
            rowHeight   : ganttView.getRowHeight(),
            ganttView   : ganttView
        }, cfg));

        this.addEvents(
            /**
             * @event beforednd
             * Fires before a drag and drop operation is initiated, return false to cancel it
             * @param {Gnt.view.Dependency} The dependency view instance
             * @param {HTMLNode} node The node that's about to be dragged
             * @param {Ext.EventObject} e The event object
             */
            'beforednd',

            /**
             * @event dndstart
             * Fires when a dependency drag and drop operation starts
             * @param {Gnt.view.Dependency} The dependency view instance
             */
            'dndstart',

            /**
             * @event drop
             * Fires after a drop has been made on a receiving terminal
             * @param {Gnt.view.Dependency} The dependency view instance
             * @param {Mixed} fromId The source dependency record id
             * @param {Mixed} toId The target dependency record id
             * @param {Number} type The dependency type, see {@link Gnt.model.Dependency} for more information
             */
            'drop',

            /**
             * @event afterdnd
             * Always fires after a dependency drag and drop operation
             * @param {Gnt.view.Dependency} view The dependency view instance
             */
            'afterdnd',

            /**
             * @event dependencyclick
             * Fires after clicking on a dependency line/arrow
             * @param {Gnt.view.Dependency} view The dependency view instance
             * @param {Gnt.model.Dependency} record The dependency record
             * @param {Ext.EventObject} event The event object
             * @param {HTMLElement} target The clicked DOM element
             */
            'dependencyclick',

            /**
             * @event dependencycontextmenu
             * Fires after right clicking on a dependency line/arrow
             * @param {Gnt.view.Dependency} view The dependency view instance
             * @param {Gnt.model.Dependency} record The dependency record
             * @param {Ext.EventObject} event The event object
             * @param {HTMLElement} target The clicked DOM element
             */
            'dependencycontextmenu',

            /**
             * @event dependencydblclick
             * Fires after double clicking on a dependency line/arrow
             * @param {Gnt.view.Dependency} view The dependency view instance
             * @param {Gnt.model.Dependency} record The dependency record
             * @param {Ext.EventObject} event The event object
             * @param {HTMLElement} target The clicked DOM element
             */
            'dependencydblclick',

            /**
             * @event refresh
             * Fires after the view has fully rendered all the dependencies in the underlying store
             * @param {Gnt.view.Dependency} view The dependency view instance
             */
            'refresh'
        );

        if (this.enableDependencyDragDrop) {
            this.dnd = Ext.create("Gnt.feature.DependencyDragDrop", {
                el              : ganttView.getEl(),
                rtl             : ganttView.rtl,
                ganttView       : ganttView,
                dragZoneConfig  : this.dragZoneConfig,
                dropZoneConfig  : this.dropZoneConfig,
                dependencyStore : this.store
            });

            this.dnd.on('drop', this.onDependencyDrop, this);
            this.relayEvents(this.dnd, ['beforednd', 'dndstart', 'afterdnd', 'drop']);
        }

        // Setup our own container element
        this.containerEl = this.containerEl.createChild({
            cls : 'sch-dependencyview-ct ' + (this.lineWidth === 1 ? ' sch-dependencyview-thin ' : '')
        });

        this.ganttView.mon(this.containerEl, {
            dblclick    : this.onDependencyClick,
            click       : this.onDependencyClick,
            contextmenu : this.onDependencyClick,
            scope       : this,
            delegate    : '.' + this.dependencyCls
        });

        if (ganttView.rendered) {
            this.renderAllDependenciesBuffered();
        }
    },

    bindDependencyStore : function (store) {
        this.depStoreListeners = {
            // For filtering, server write etc
            refresh         : this.renderAllDependenciesBuffered,
            clear           : this.renderAllDependenciesBuffered,

            load            : this.renderAllDependenciesBuffered,

            add             : this.onDependencyAdd,
            update          : this.onDependencyUpdate,
            remove          : this.onDependencyDelete,

            scope           : this
        };

        store.on(this.depStoreListeners);

        this.store = store;
    },

    unBindDependencyStore : function () {
        if (this.depStoreListeners) {
            this.store.un(this.depStoreListeners);
        }
    },

    bindTaskStore : function (taskStore) {
        var ganttView       = this.ganttView;

        this.taskStoreListeners = {
            cascade             : this.onTaskStoreCascade,

            beforefill          : this.onRootFillStart,

            remove              : this.renderAllDependenciesBuffered,
            insert              : this.renderAllDependenciesBuffered,
            append              : this.renderAllDependenciesBuffered,
            move                : this.renderAllDependenciesBuffered,

            sort                : this.renderAllDependenciesBuffered,

            scope               : this
        };

        Ext.apply(this.taskStoreListeners, {
            expand          : this.renderAllDependenciesBuffered,
            collapse        : this.renderAllDependenciesBuffered
        });

        taskStore.on(this.taskStoreListeners);

        this.taskStore = taskStore;
    },

    onTaskStoreCascade : function(store, cascadeContext) {
        if (cascadeContext && cascadeContext.nbrAffected > 0) {
            this.renderAllDependenciesBuffered();
        }
    },

    unBindTaskStore : function (taskStore) {
        taskStore       = taskStore || this.taskStore;

        if (!taskStore) return;

        if (this.ganttViewListeners) {
            this.ganttView.un(this.ganttViewListeners);
        }

        taskStore.un(this.taskStoreListeners);
    },

    onRootFillStart : function() {
        var store = this.taskStore;

        this.unBindTaskStore(store);

        this.mon(this.taskStore, 'fillcomplete', function() { this.bindTaskStore(store); }, this, { single : true });
    },

    onDependencyClick : function(e, t) {
        var rec = this.getRecordForDependencyEl(t);
        this.fireEvent('dependency' + e.type, this, rec, e, t);
    },

    /**
     * Highlight the elements representing a particular dependency
     * @param {Mixed} record Either the id of a record or a record in the dependency store
     */
    highlightDependency: function (record) {
        if (!(record instanceof Ext.data.Model)) {
            record = this.getDependencyRecordByInternalId(record);
        }

        if (record) {
            record.isHighlighted    = true;

            this.getElementsForDependency(record).addCls(this.selectedCls);
        }
    },


    /**
     * Remove highlight of the elements representing a particular dependency
     * @param {Mixed} record Either the id of a record or a record in the dependency store
     */
    unhighlightDependency: function (record) {
        if (!(record instanceof Ext.data.Model)) {
            record = this.getDependencyRecordByInternalId(record);
        }

        if (record) {
            record.isHighlighted    = false;

            this.getElementsForDependency(record).removeCls(this.selectedCls);
        }
    },


    /**
     * Retrieve the elements representing a particular dependency
     * @param {Gnt.model.Dependency} rec the record in the dependency store
     * @return {Ext.CompositeElementLite/Ext.CompositeElement}
     */
    getElementsForDependency: function (rec) {
        var id = rec instanceof Ext.data.Model ? rec.internalId : rec;
        return this.containerEl.select('.sch-dep-' + id);
    },

    // private
    depRe: new RegExp('sch-dep-([^\\s]+)'),


    getDependencyRecordByInternalId : function(id) {
        var r, i, l;

        for (i = 0, l = this.store.getCount(); i < l; i++) {
            r = this.store.getAt(i);
            if (r.internalId == id) {
                return r;
            }
        }
        return null;
    },

    // private
    getRecordForDependencyEl: function (t) {
        var m = t.className.match(this.depRe),
            rec = null;

        if (m && m[1]) {
            var recordId = m[1];

            rec = this.getDependencyRecordByInternalId(recordId);
        }

        return rec;
    },


    renderAllDependenciesBuffered : function () {
        var me              = this;

        var hiddenParent    = this.ganttView.up("{isHidden()}");

        // if view el is hidden, postpone the paint until next time it's shown
        if (hiddenParent) {
            clearTimeout(me.renderTimer);
            me.renderTimer  = null;

            hiddenParent.on('show', this.renderAllDependenciesBuffered, this, { single : true });
            return;
        }

        // Check if rendering is already scheduled
        if (me.renderTimer) return;

        this.containerEl.update('');

        this.renderTimer    = setTimeout(function () {
            me.renderTimer  = null;

            if (!me.ganttView.isDestroyed) me.renderAllDependencies();
        }, 0);
    },

    /**
     * Renders all the dependencies for the current view
     */
    renderAllDependencies : function() {
        // component has been destroyed already
        if (!this.containerEl.dom) return;

        this.containerEl.update('');
        this.renderDependencies(this.store.data.items);
        this.fireEvent('refresh', this);
    },

    /**
     * Returns all the elements representing the rendered dependencies
     * @return {Ext.CompositeElementLite/Ext.CompositeElement}
     */
    getDependencyElements : function() {
        return this.containerEl.select('.' + this.dependencyCls);
    },

    renderDependencies: function (dependencyRecords) {
        if (dependencyRecords){
            var tplData = this.painter.getDependencyTplData(dependencyRecords);
            this.lineTpl[Ext.isIE ? "insertFirst" : "append"](this.containerEl, tplData);
        }
    },


    renderTaskDependencies: function (tasks) {
        var toDraw  = [];

        if (tasks instanceof Ext.data.Model) {
            tasks = [tasks];
        }

        for (var i = 0, n = tasks.length; i < n; i++) {
            toDraw = toDraw.concat(tasks[i].getAllDependencies());
        }
        this.renderDependencies(toDraw);
    },

    onDependencyUpdate: function (store, depRecord) {
        this.removeDependencyElements(depRecord, false);

        // Draw new dependencies for the event
        this.renderDependencies(depRecord);
    },



    onDependencyAdd: function (store, depRecords) {
        // Draw added dependencies
        this.renderDependencies(depRecords);
    },

    removeDependencyElements: function (record, animate) {
        if (animate !== false) {
            this.getElementsForDependency(record).fadeOut({ remove: true });
        } else {
            this.getElementsForDependency(record).remove();
        }
    },

    onDependencyDelete: function (store, depRecord) {
        this.removeDependencyElements(depRecord);
    },

    dimEventDependencies: function (eventId) {
        this.containerEl.select(this.depRe + eventId).setOpacity(0.2);
    },

    // private
    clearSelectedDependencies : function() {
        this.containerEl.select('.' + this.selectedCls).removeCls(this.selectedCls);

        this.store.each(function (dependency) {
            dependency.isHighlighted    = false;
        });
    },


    onTaskUpdated: function (task) {
        if (!this.taskStore.cascading && (!task.previous || task.startDateField in task.previous || task.endDateField in task.previous)) {
            this.updateDependencies(task);
        }
    },


    updateDependencies: function (tasks) {
        if (tasks instanceof Ext.data.Model) {
            tasks = [ tasks ];
        }

        var me      = this;

        Ext.each(tasks, function (task) {
            Ext.each(task.getAllDependencies(), function (dependency) {
                me.removeDependencyElements(dependency, false);
            });
        });

        // Draw new dependencies for the task
        this.renderTaskDependencies(tasks);
    },


    onNewDependencyCreated : function () {
    },


    onDependencyDrop: function (plugin, fromId, toId, type) {
        var dependencyStore = this.store;

        var newDependency = new dependencyStore.model();
        newDependency.setSourceId(fromId);
        newDependency.setTargetId(toId);
        newDependency.setType(type);

        if (dependencyStore.isValidDependency(newDependency) && this.onNewDependencyCreated(newDependency) !== false) {
            dependencyStore.add(newDependency);
        }
    },

    destroy: function () {
        if (this.dnd) {
            this.dnd.destroy();
        }

        this.unBindTaskStore();

        this.unBindDependencyStore();
    },

    setRowHeight : function(height, preventRefresh) {
        this.rowHeight = height;
        this.painter.setRowHeight(height);

        if (!preventRefresh) {
            this.renderAllDependencies();
        }
    }
});

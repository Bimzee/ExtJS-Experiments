/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Gnt.template.Task
@extends Ext.XTemplate

Template class used to render a regular leaf task.
*/
Ext.define("Gnt.template.Task", {
    extend : 'Gnt.template.Template',

    /**
     * @cfg {String} innerTpl The template defining the inner visual markup for the task.
     */
    innerTpl : '<div class="sch-gantt-progress-bar" style="width:{percentDone}%;{progressBarStyle}" unselectable="on">&#160;</div>',

    getInnerTpl : function (cfg) {
        var side = cfg.rtl ? 'right' : 'left';

        return '<div id="' + cfg.prefix + '{id}" class="sch-gantt-item sch-gantt-task-bar {cls}" unselectable="on" style="width:{width}px;{style}">'+

                   '<tpl if="isRollup">' +
                   '<tpl else>' +

                    // @BWCOMPAT 2.2: sch-resizable-handle-west and sch-resizable-handle-east should be removed in 3.0
                    ((cfg.resizeHandles === 'both' || cfg.resizeHandles === 'left') ? '<div class="sch-resizable-handle sch-gantt-task-handle sch-resizable-handle-start sch-resizable-handle-west"></div>' : '') +

                    this.innerTpl +

                    ((cfg.resizeHandles === 'both' || cfg.resizeHandles === 'right') ? '<div class="sch-resizable-handle sch-gantt-task-handle sch-resizable-handle-end sch-resizable-handle-east"></div>' : '') +

                    (cfg.enableProgressBarResize ? '<div style="' + side + ':{percentDone}%" class="sch-gantt-progressbar-handle"></div>': '') +

                    // Left / Right terminals
                    (cfg.enableDependencyDragDrop ? this.dependencyTerminalMarkup : '') +

                    '</tpl>'+

                '</div>';
    }
});
/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Gnt.plugin.Printable
@extends Sch.plugin.Printable

A plugin (ptype = 'gantt_printable') for printing the content of an Ext Gantt panel. Please note that this will not generate a picture perfect
 printed version, due to various limitations in the browser print implementations. If you require a high quality print, you should use the Export plugin instead and first export to PDF.

You can add it to your gantt chart like any other plugin and it will add a new method `print` to the gantt panel itself:

    var gantt = Ext.create('Gnt.panel.Gantt', {
    
        plugins             : [
            Ext.create("Gnt.plugin.Printable")
        ],
        ...
    })

    gantt.print();

*/
Ext.define("Gnt.plugin.Printable", {
    extend : "Sch.plugin.Printable",
    alias  : 'plugin.gantt_printable',

    getGridContent : function(gantt) {
        var ganttView  = gantt.getSchedulingView();

        ganttView._print = true;

        var retVal     = this.callParent(arguments),
            depView    = ganttView.dependencyView,
            tplData    = depView.painter.getDependencyTplData(ganttView.dependencyStore.getRange()),
            depHtml    = '<div class="' + depView.containerEl.dom.className + '">' + depView.lineTpl.apply(tplData) + '</div>',
            normalRows = retVal.normalRows;

        //highlight critical path
        if (Ext.select('.sch-gantt-critical-chain').first()){
            var el = Ext.DomHelper.createDom({
                tag     : 'div',
                html    : depHtml
            });
            el = Ext.get(el);

            var elRows = Ext.DomHelper.createDom({
                tag: 'div',
                html: normalRows
            });
            elRows = Ext.get(elRows);

            var paths = ganttView.getCriticalPaths(),
                ds = ganttView.dependencyStore,
                t,i,l, depRecord;

            //Simplified critical path highlighting
            Ext.each(paths, function(tasks) {
                for (i = 0, l = tasks.length; i < l; i++) {
                    t = tasks[i];
                    this.highlightTask(t, gantt, elRows);

                    if (i < (l - 1)) {
                        depRecord = ds.getAt(ds.findBy(function(dep) {
                            return dep.getTargetId() === (t.getId() || t.internalId) && dep.getSourceId() === (tasks[i+1].getId() || tasks[i+1].internalId);
                        }));
                        this.highlightDependency(depRecord, el, depView);
                    }
                }
            }, this);

            normalRows = elRows.getHTML();
            depHtml = el.getHTML();
        }

        retVal.normalRows = depHtml + normalRows;

        delete ganttView._print;

        return retVal;
    },

    highlightTask: function(task, gantt, containerEl){
        var el = gantt.getSchedulingView().getElementFromEventRecord(task),
            elId = el.id;

            if (el) {
                containerEl.select('#'+elId).first().parent('tr').addCls('sch-gantt-task-highlighted');
            }
    },

    highlightDependency: function(rec, containerEl, depView){
        var id = rec instanceof Ext.data.Model ? rec.internalId : rec;

        return containerEl.select('.sch-dep-' + id).addCls(depView.selectedCls);
    }
});
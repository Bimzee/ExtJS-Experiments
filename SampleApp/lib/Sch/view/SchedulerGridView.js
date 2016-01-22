/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Sch.view.SchedulerGridView
@extends Sch.view.TimelineGridView
@mixin Sch.mixin.SchedulerView

Empty class just consuming the Sch.mixin.SchedulerView mixin.

*/
Ext.define("Sch.view.SchedulerGridView", {
    extend              : 'Sch.view.TimelineGridView',
    mixins              : ['Sch.mixin.SchedulerView', 'Sch.mixin.Localizable'],
    alias               : 'widget.schedulergridview'
}, function() {
    this.override(Sch.mixin.SchedulerView.prototype.inheritables() || {});
});


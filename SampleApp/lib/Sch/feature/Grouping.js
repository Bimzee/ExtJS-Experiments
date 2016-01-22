/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 @class Sch.feature.Grouping
 @extends Ext.grid.feature.Grouping

 A feature extending the native Ext JS grouping feature (ftype = 'scheduler_grouping'). This features provides a
 {@link #headerRenderer} hook that you can use to render custom HTML into the group header for
 every time interval in the {@link Sch.data.TimeAxis}. This header will be automatically refreshed when changes happen in the eventStore and
 resourceStore.

 To add this feature to the scheduler:

    var scheduler = Ext.create("Sch.panel.SchedulerGrid", {

        features      : [
            {
                id                 : 'group',
                ftype              : 'scheduler_grouping',
                hideGroupedHeader  : true,
                enableGroupingMenu : false,

                headerRenderer : function (intervalStartDate, intervalEndDate, groupResources, meta) {

                    meta.cellStyle = 'background : rgba(255, 0, 0, 0.5)';
                    meta.cellCls   = 'some-css-class';

                    return 'Any text here';
                }
            }
        ],

        ...
    });
 */
Ext.define('Sch.feature.Grouping', {
    extend : 'Ext.grid.feature.Grouping',
    alias  : 'feature.scheduler_grouping',

    /**
     * This renderer method is called once for each time interval in the {@link Sch.data.TimeAxis time axis} when the scheduler is rendered.
     * Additionally, it is also called when resources and events are updated, added and removed. You can return any
     * arbitrary HTML to be added to each 'cell' of the header.
     *
     * @param {Date} intervalStartDate Start date of the current time interval
     * @param {Date} intervalEndDate End date of the current time interval
     * @param {Sch.model.Resource[]} groupResources The resources in the current group
     * @param {Object} meta A special object containing rendering properties for the current cell
     * @param {Object} meta.cellCls A CSS class to add to the cell DIV
     * @param {Object} meta.cellStyle Any inline styles to add to the cell DIV
     * @return {String}
     */
    headerRenderer      : Ext.emptyFn,

    timeAxisViewModel   : null,

    headerCellTpl       : '<tpl for=".">' +
        '<div class="sch-grid-group-hd-cell {cellCls}" style="{cellStyle}; width: {width}px;">' +
        '<span>{value}</span>' +
        '</div>' +
        '</tpl>',

    renderCells         : function (data) {
        var tplData = [];
        var ticks = this.timeAxisViewModel.columnConfig[this.timeAxisViewModel.columnLinesFor];

        for (var i = 0; i < ticks.length; i++) {
            var meta = {};
            var value = this.headerRenderer(ticks[i].start, ticks[i].end, data.groupInfo.children, meta);

            meta.value = value;
            meta.width = ticks[i].width;

            tplData.push(meta);
        }

        return this.headerCellTpl.apply(tplData);
    },
    
    constructor : function (cfg) {
        var tplCfg = Ext.getVersion().isLessThan('4.2.2.1144') ? this.get421TplCfg() : this.get422TplCfg();
        
        Ext.apply(cfg, {
            groupTpl    : tplCfg.concat(
                {
                    priority: 200,
                    
                    shouldRenderCustomCells : function (values) {
                        return values.view.ownerCt !== values.view.ownerCt.ownerLockable.lockedGrid && this.groupingFeature.headerRenderer !== Ext.emptyFn;
                    },
        
                    syncRowHeights: function(firstRow, secondRow) {
                        firstRow = Ext.fly(firstRow, 'syncDest');
                        secondRow = Ext.fly(secondRow, 'sycSrc');
                        var owner = this.owner,
                            firstHd = firstRow.down(owner.eventSelector, true),
                            secondHd,
                            firstSummaryRow = firstRow.down(owner.summaryRowSelector, true),
                            secondSummaryRow,
                            firstHeight, secondHeight;
        
                        // Sync the heights of header elements in each row if they need it.
                        if (firstHd && (secondHd = secondRow.down(owner.eventSelector, true))) {
                            firstHd.style.height = secondHd.style.height = '';
                            if ((firstHeight = firstHd.offsetHeight) > (secondHeight = secondHd.offsetHeight)) {
                                Ext.fly(secondHd).setHeight(firstHeight);
                            }
                            else if (secondHeight > firstHeight) {
                                Ext.fly(firstHd).setHeight(secondHeight);
                            }
                        }
        
                        // Sync the heights of summary row in each row if they need it.
                        if (firstSummaryRow && (secondSummaryRow = secondRow.down(owner.summaryRowSelector, true))) {
                            firstSummaryRow.style.height = secondSummaryRow.style.height = '';
                            if ((firstHeight = firstSummaryRow.offsetHeight) > (secondHeight = secondSummaryRow.offsetHeight)) {
                                Ext.fly(secondSummaryRow).setHeight(firstHeight);
                            }
                            else if (secondHeight > firstHeight) {
                                Ext.fly(firstSummaryRow).setHeight(secondHeight);
                            }
                        }
                    },
        
                    syncContent: function(destRow, sourceRow) {
                        destRow = Ext.fly(destRow, 'syncDest');
                        sourceRow = Ext.fly(sourceRow, 'sycSrc');
                        var owner = this.owner,
                            destHd = destRow.down(owner.eventSelector, true),
                            sourceHd = sourceRow.down(owner.eventSelector, true),
                            destSummaryRow = destRow.down(owner.summaryRowSelector, true),
                            sourceSummaryRow = sourceRow.down(owner.summaryRowSelector, true);
        
                        // Sync the content of header element.
                        if (destHd && sourceHd) {
                            Ext.fly(destHd).syncContent(sourceHd);
                        }
        
                        // Sync the content of summary row element.
                        if (destSummaryRow && sourceSummaryRow) {
                            Ext.fly(destSummaryRow).syncContent(sourceSummaryRow);
                        }
                    }
                }
            )
        });
            
        this.callParent(arguments);
    },
    
    get422TplCfg   : function () {
        return [
            '{%',
                'var me = this.groupingFeature;',
                // If grouping is disabled, do not call setupRowData, and do not wrap
                'if (me.disabled) {',
                    'values.needsWrap = false;',
                '} else {',
                    // setupRowData requires the index in the data source, not the index in the real store
                    'me.setupRowData(values.record, values.rowIndex, values);',
                '}',
            '%}',
            '<tpl if="needsWrap">',
                '<tr {[values.isCollapsedGroup ? ("id=\\"" + values.rowId + "\\"") : ""]} data-boundView="{view.id}" data-recordId="{record.internalId:htmlEncode}" data-recordIndex="{[values.isCollapsedGroup ? -1 : values.recordIndex]}" ',
                    'class="{[values.itemClasses.join(" ")]} ', Ext.baseCSSPrefix, 'grid-wrap-row<tpl if="!summaryRecord"> ', Ext.baseCSSPrefix, 'grid-group-row</tpl>" {ariaRowAttr}>',
                    '<td class="', Ext.baseCSSPrefix, 'group-hd-container',
                        '<tpl if="this.shouldRenderCustomCells(values)">',
                            ' sch-grid-group-custom-header',
                        '</tpl>',
                        '" colspan="{columns.length}" {ariaCellAttr}>',
                        '<tpl if="isFirstRow">',
                            '{%',
                                // Group title is visible if not locking, or we are the locked side, or the locked side has no columns/
                                // Use visibility to keep row heights synced without intervention.
                                'var groupTitleStyle = (!values.view.lockingPartner || (values.view.ownerCt === values.view.ownerCt.ownerLockable.lockedGrid) || (values.view.lockingPartner.headerCt.getVisibleGridColumns().length === 0)) ? "" : "visibility:hidden";',
                            '%}',
                            '<tpl if="!this.shouldRenderCustomCells(values)">',
                                '<div id="{groupId}" class="', Ext.baseCSSPrefix, 'grid-group-hd {collapsibleCls}" tabIndex="0" hidefocus="on" {ariaCellInnerAttr}>',
                                    '<div class="', Ext.baseCSSPrefix, 'grid-group-title" style="{[groupTitleStyle]}" {ariaGroupTitleAttr}>',
                                        '{[values.groupHeaderTpl.apply(values.groupInfo, parent) || "&#160;"]}',
                                    '</div>',
                                '</div>',
                            '<tpl else>',
                                '<div id="{groupId}" class="', Ext.baseCSSPrefix, 'grid-group-hd {collapsibleCls}" tabIndex="0" hidefocus="on" {ariaCellInnerAttr}>',
                                    '{[this.groupingFeature.renderCells(values) || "&#160;"]}',
                                '</div>',
                            '</tpl>',
                        '</tpl>',
    
                        // Only output the child rows if  this is *not* a collapsed group
                        '<tpl if="summaryRecord || !isCollapsedGroup">',
                            '<table class="', Ext.baseCSSPrefix, '{view.id}-table ', Ext.baseCSSPrefix, 'grid-table',
                                '<tpl if="summaryRecord"> ', Ext.baseCSSPrefix, 'grid-table-summary</tpl>"',
                                'border="0" cellspacing="0" cellpadding="0" style="width:100%" {ariaSummaryTableAttr}>',
                                '{[values.view.renderColumnSizer(out)]}',
                                // Only output the first row if this is *not* a collapsed group
                                '<tpl if="!isCollapsedGroup">',
                                    '{%',
                                        'values.itemClasses.length = 0;',
                                        'this.nextTpl.applyOut(values, out, parent);',
                                    '%}',
                                '</tpl>',
                                '<tpl if="summaryRecord">',
                                    '{%me.outputSummaryRecord(values.summaryRecord, values, out);%}',
                                '</tpl>',
                            '</table>',
                        '</tpl>',
                    '</td>',
                '</tr>',
            '<tpl else>',
                '{%this.nextTpl.applyOut(values, out, parent);%}',
            '</tpl>'
        ];
    },
    
    get421TplCfg    : function () {
        return [
            '{%',
                'var me = this.groupingFeature;',
                // If grouping is disabled, do not call setupRowData, and do not wrap
                'if (me.disabled) {',
                    'values.needsWrap = false;',
                '} else {',
                    'me.setupRowData(values.record, values.recordIndex, values);',
                    'values.needsWrap = !me.disabled && (values.isFirstRow || values.summaryRecord);',
                '}',
            '%}',
            '<tpl if="needsWrap">',
                '<tr data-boundView="{view.id}" data-recordId="{record.internalId}" data-recordIndex="{[values.isCollapsedGroup ? -1 : values.recordIndex]}"',
                    'class="{[values.itemClasses.join(" ")]} ' + Ext.baseCSSPrefix + 'grid-wrap-row<tpl if="!summaryRecord"> ' + Ext.baseCSSPrefix + 'grid-group-row</tpl>">',
                    '<td class="' + Ext.baseCSSPrefix + 'group-hd-container" colspan="{columns.length}">',
                        '<tpl if="isFirstRow">',
                            '{%',
                            // Group title is visible if not locking, or we are the locked side, or the locked side has no columns/
                            // Use visibility to keep row heights synced without intervention.
                            'var groupTitleStyle = (!values.view.lockingPartner || (values.view.ownerCt === values.view.ownerCt.ownerLockable.lockedGrid) || (values.view.lockingPartner.headerCt.getVisibleGridColumns().length === 0)) ? "" : "visibility:hidden";',
                            '%}',
                            '<tpl if="(values.view.ownerCt === values.view.ownerCt.ownerLockable.lockedGrid) || !this.groupingFeature.headerRenderer || this.groupingFeature.headerRenderer == Ext.emptyFn">',
                                '<div id="{groupId}" class="', Ext.baseCSSPrefix, 'grid-group-hd {collapsibleCls}" tabIndex="0" hidefocus="on" {ariaCellInnerAttr}>',
                                    '<div class="', Ext.baseCSSPrefix, 'grid-group-title" style="{[groupTitleStyle]}" {ariaGroupTitleAttr}>',
                                        '{[values.groupHeaderTpl.apply(values.groupInfo, parent) || "&#160;"]}',
                                    '</div>',
                                '</div>',
                            '<tpl else>',
                                '<div id="{groupId}" class="', Ext.baseCSSPrefix, 'grid-group-hd sch-grid-group-hd {collapsibleCls}" tabIndex="0" hidefocus="on" {ariaCellInnerAttr}>',
                                    '{[this.groupingFeature.renderCells(values)]}',
                                '</div>',
                            '</tpl>',
                        '</tpl>',
                
                        // Only output the child rows if  this is *not* a collapsed group
                        '<tpl if="summaryRecord || !isCollapsedGroup">',
                        '<table class="', Ext.baseCSSPrefix, '{view.id}-table ', Ext.baseCSSPrefix, 'grid-table',
                            '<tpl if="summaryRecord"> ', Ext.baseCSSPrefix, 'grid-table-summary</tpl>"',
                            'border="0" cellspacing="0" cellpadding="0" style="width:100%">',
                            '{[values.view.renderColumnSizer(out)]}',
                            // Only output the first row if this is *not* a collapsed group
                            '<tpl if="!isCollapsedGroup">',
                                '{%',
                                    'values.itemClasses.length = 0;',
                                    'this.nextTpl.applyOut(values, out, parent);',
                                '%}',
                            '</tpl>',
                            '<tpl if="summaryRecord">',
                                '{%me.outputSummaryRecord(values.summaryRecord, values, out);%}',
                            '</tpl>',
                        '</table>',
                        '</tpl>',
                    '</td>',
                '</tr>',
            '<tpl else>',
                '{%this.nextTpl.applyOut(values, out, parent);%}',
            '</tpl>'
        ];
    },

    init : function () {
        this.callParent(arguments);

        if (typeof this.headerCellTpl === 'string') {
            this.headerCellTpl = new Ext.XTemplate(this.headerCellTpl);
        }

        // The functionality of this class only applies to the scheduling view section
        if (this.view.eventStore) {

            this.timeAxisViewModel = this.view.timeAxisViewModel;

            this.view.mon(this.view.eventStore, {
                add    : this.refreshGroupHeader,
                remove : this.refreshGroupHeader,
                update : this.refreshGroupHeader,
                scope  : this
            });
        }
    },

    destroy : function () {
        // Do any cleanup here

        this.callParent(arguments);
    },

    getNodeIndex : function (view, record) {
        var store = view.resourceStore;
        // in case this method is called after 'remove' event record.getResource() will return null
        // so we pass a custom eventStore to this method
        var group = store.getGroups(store.getGroupString(record.getResource(null, view.eventStore)));

        // first child in this group is the first node that holds the grouping header
        return view.indexOf(group.children[0]);
    },

    refreshGroupHeader : function (store, records) {
        var me      = this,
            view    = me.view;

        records = Ext.isArray(records) ? records : [records];

        Ext.Array.each(records, function (record) {
            view.refreshNode(me.getNodeIndex(view, record));
        });
    }
});
/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 @class Sch.plugin.exporter.AbstractExporter
 @extends Ext.util.Observable

 This class represents the base implementation of an exporter.
 An exporter extracts the provided component content and packs it into array of pages (based on provided export settings and implemented algorithm).
 The main entry point for an exporter that launches the extraction process is {@link #extractPages} method:

             exporter.extractPages(component, config, function (pages) {

                alert(pages.length + " extracted");

                ...

             }, me);


*/
Ext.define('Sch.plugin.exporter.AbstractExporter', {

    extend      : 'Ext.util.Observable',

    requires    : [
        'Ext.dom.Element',
        'Ext.core.DomHelper'
    ],

    mixins      : ['Sch.mixin.Localizable'],

    /**
     * @cfg {Object} pageSizes
     * Definition of all available paper sizes.
     */
    pageSizes   : {
        A5      : {
            width   : 5.8,
            height  : 8.3
        },
        A4      : {
            width   : 8.3,
            height  : 11.7
        },
        A3      : {
            width   : 11.7,
            height  : 16.5
        },
        Letter  : {
            width   : 8.5,
            height  : 11
        },
        Legal   : {
            width   : 8.5,
            height  : 14
        }
    },


    pageHeaderHeight        : 41,

    bufferedHeightMargin    : 25,

    /**
     * @property {Number} paperWidth
     * Paper width. Calculated based on provided page format and DPI resolution.
     */
    paperWidth              : 0,

    /**
     * @property {Number} paperHeight
     * Paper height. Calculated based on provided page format and DPI resolution.
     */
    paperHeight             : 0,

    /**
     * @property {Number} printHeight
     * Paper height that can be used for printing rows. Calculated as {@link #paperHeight} minus header heights.
     */
    printHeight             : 0,

    lockedRowsHeight        : 0,

    normalRowsHeight        : 0,

    iterateTimeout          : 10,

    /**
     * @cfg {String} tableSelector
     * The selector for the row container used for both normalGrid and lockedGrid.
     */
    tableSelector           : undefined,

    /**
     * @property {Ext.dom.Element} currentPage
     * Current page being extracted.
     */
    currentPage             : undefined,

    /**
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:

            - name    : 'Exporter'
     */

    config                  : {
        /**
         * @cfg {String} exporterId
         * Exporter identifier. Has to be unique among other exporters when you register in in {@link Sch.plugin.Export} instance.
         */
        exporterId              : 'abstractexporter',
        /**
         * Exporter name. By default will be taken from the class {@link #l10n locale}.
         * @cfg {String}
         */
        name                    : '',

        translateURLsToAbsolute : true,

        expandAllBeforeExport   : false,

        /**
         * @cfg {String} tpl
         * Template of extracted page.
         */
        tpl                     : '<!DOCTYPE html>' +
            '<html class="' + Ext.baseCSSPrefix + 'border-box {htmlClasses}">' +
            '<head>' +
            '<meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />' +
            '<title>{title}</title>' +
            '{styles}' +
            '</head>' +
            '<body class="' + Ext.baseCSSPrefix + 'webkit sch-export {bodyClasses}">' +
            '<tpl if="showHeader">' +
            '<div class="sch-export-header" style="width:{totalWidth}px"><h2>{number}/{total}</h2></div>' +
            '</tpl>' +
            '<div class="{componentClasses}" style="height:{bodyHeight}px; width:{totalWidth}px; position: relative !important">' +
            '{HTML}' +
            '</div>' +
            '</body>' +
            '</html>',

        /**
         * @cfg {Number} DPI
         * DPI (Dots per inch) resolution.
         */
        DPI                     : 72
    },

    //private placeholder for provided callback functions passed in extractPages
    callbacks               : undefined,

    //private String errorMessage, when internally set this message will be displayed in a pop-up message.
    error                   : undefined,

    /**
     * @property {Array[Object]} extractedPages Collection of extracted pages.
     */
    extractedPages          : undefined,

    /**
     * @property {Number} numberOfPages Total number of pages extracted.
     */
    numberOfPages           : 0,

    constructor : function (config) {
        var me  = this;

        config  = config || {};

        me.initConfig(config);

        me.callParent(arguments);

        if (!config.tableSelector) {
            me.tableSelector    = '.' + Ext.baseCSSPrefix + (Ext.versions.extjs.isLessThan('5.0') ? 'grid-table' : 'grid-item-container');
        }

        // get the exporter name from locale (if not provided explicitly)
        if (!config.name) me.setName(me.L('name'));
    },


    setTpl : function (tpl) {
        this.tpl    = new Ext.XTemplate(tpl, { disableFormats : true });
    },


    getTpl : function () {
        return this.tpl;
    },

    /**
     * @protected
     * Returns the CSS classes for BODY element of extracted page. Override this if you need to customize exported pages CSS classes.
     * @return {String} CSS classes.
     */
    getBodyClasses : function () {
        var re      = new RegExp(Ext.baseCSSPrefix + 'ie\\d?|' + Ext.baseCSSPrefix + 'gecko', 'g'),
            result  = Ext.getBody().dom.className.replace(re, '');

        if (Ext.isIE) {
            result  += ' sch-ie-export';
        }

        return result;
    },

    /**
     * @protected
     * Returns the CSS classes for element containing exported component. Override this if you need to customize exported pages CSS classes.
     * @return {String} CSS classes.
     */
    getComponentClasses : function () {
        return this.getComponent().el.dom.className;
    },

    /**
     * Sets the component being exported.
     * @param {Sch.panel.SchedulerGrid/Sch.panel.SchedulerTree} component The component being exported.
     */
    setComponent : function (component) {
        var me                  = this;

        me.component            = component;
        me.view                 = component.getSchedulingView();
        me.normalGrid           = component.normalGrid;
        me.lockedGrid           = component.lockedGrid;
        me.normalView           = component.normalGrid.view;
        me.lockedView           = component.lockedGrid.view;
        me.lockedBodySelector   = '#' + me.lockedView.getId();
        me.normalBodySelector   = '#' + me.normalView.getId();
        me.lockedHeader         = me.lockedGrid.headerCt;
        me.normalHeader         = me.normalGrid.headerCt;
        me.headerHeight         = me.normalHeader.getHeight();

        // page height w/o component headers
        me.printHeight = Math.floor(me.paperHeight) - me.headerHeight - (me.exportConfig.showHeader ? me.pageHeaderHeight : 0);

        me.saveComponentState(component);
    },

    /**
     * Returns the component being exported.
     * @return {Sch.panel.SchedulerGrid/Sch.panel.SchedulerTree} The component being exported.
     */
    getComponent : function () {
        return this.component;
    },


    /**
     * @private
     * Applies the selected paper size based on export configuration and {@link #paperSizes} config. Calculates {@link #paperWidth} and {@link #paperHeight} properties.
     */
    setPaperSize : function () {
        var me          = this,
            config      = me.exportConfig,
            dpi         = config.DPI || me.getDPI(),
            pageSize    = me.pageSizes[config.format];

        //size of paper we will be printing on. 72 DPI used by phantomJs generator
        //take orientation into account
        if (config.orientation === 'landscape') {
            me.paperWidth   = pageSize.height * dpi;
            me.paperHeight  = pageSize.width * dpi;
        } else {
            me.paperWidth   = pageSize.width * dpi;
            me.paperHeight  = pageSize.height * dpi;
        }
    },

    /**
     * @return {String} returns the format of the current export operation.
     */
    getPaperFormat : function () {
        return this.exportConfig.format;
    },


    /**
     * @private
     * Returns whether the component uses buffered rendering.
     * @return {boolean} `true` if the underlying component uses buffered rendering.
     */
    isBuffered : function () {
        return !!this.getBufferedRenderer();
    },

    /**
     * @private
     * Returns the normal grid buffered renderer instance (if the component uses buffered rendering).
     * @return {Ext.grid.plugin.BufferedRendererView} The normal grid buffered renderer instance.
     */
    getBufferedRenderer : function () {
        return this.view.bufferedRenderer;
    },

    /**
     * @protected
     * Applies the passed date range to the component.
     * @param {Object} config Export configuration.
     */
    setComponentRange : function (config) {
        var me          = this,
            component   = me.getComponent(),
            view        = me.view,
            newStart,
            newEnd;

        // if we export a part of scheduler
        if (config.range !== 'complete') {

            switch (config.range) {
                case 'date' :
                    newStart    = new Date(config.dateFrom);
                    newEnd      = new Date(config.dateTo);

                    // ensure that specified period has at least a day
                    if (Sch.util.Date.getDurationInDays(newStart, newEnd) < 1) {
                        newEnd  = Sch.util.Date.add(newEnd, Sch.util.Date.DAY, 1);
                    }

                    newStart    = Sch.util.Date.constrain(newStart, component.getStart(), component.getEnd());
                    newEnd      = Sch.util.Date.constrain(newEnd, component.getStart(), component.getEnd());
                    break;

                case 'current' :
                    var visibleSpan = view.getVisibleDateRange();
                    newStart        = visibleSpan.startDate;
                    newEnd          = visibleSpan.endDate || view.timeAxis.getEnd();

                    if (config.cellSize) {
                        // will change columns width to provided value
                        var cellSize = config.cellSize;

                        me.timeColumnWidth = cellSize[0];

                        if (me.timeColumnWidth) {
                            component.setTimeColumnWidth(me.timeColumnWidth);
                        }

                        // change the row height only if value is provided
                        if (cellSize.length > 1) {
                            me.view.setRowHeight(cellSize[1]);
                        }
                    }

                    break;
            }

            // set specified time frame
            component.setTimeSpan(newStart, newEnd);
        }

        me.ticks  = component.timeAxis.getTicks();

    },

    /**
     * @protected
     * Get links to the stylesheets of current page.
     */
    getStylesheets : function() {
        var translate   = this.translateURLsToAbsolute,
            styleSheets = Ext.getDoc().select('link[rel="stylesheet"]'),
            ctTmp       = Ext.get(Ext.core.DomHelper.createDom({
                tag : 'div'
            })),
            stylesString;

        styleSheets.each(function(s) {
            var node    = s.dom.cloneNode(true);
            // put absolute URL to node `href` attribute
            translate && node.setAttribute('href', s.dom.href);
            ctTmp.appendChild(node);
        });

        stylesString = ctTmp.dom.innerHTML + '';

        return stylesString;
    },


    // Since export is a sync operation for now, all plugins drawing lines & zones need to be temporarily adjusted
    // to draw their content synchronously.
    forEachTimeSpanPlugin : function (component, fn, scope) {
        if (Sch.feature && Sch.feature.AbstractTimeSpan) {

            var me = this;
            var plugins = (component.plugins || []).concat(component.normalGrid.plugins || []).concat(component.columnLinesFeature || []);

            for (var i = 0, l = plugins.length; i < l; i++) {
                var plugin  = plugins[i];

                if (plugin instanceof Sch.feature.AbstractTimeSpan) {
                    fn.call(scope || me, plugin);
                }
            }
        }
    },


    /**
     * @protected
     * Prepares the component to export. This includes setting requested time span, time column width etc.
     * @param {Sch.panel.SchedulerGrid/Sch.panel.SchedulerTree} component The component being exported.
     * @param {Object} config    Export configuration.
     */
    prepareComponent : function (component, config) {
        var me      = this;

        component   = component || me.getComponent();

        me.forEachTimeSpanPlugin(component, function (plugin) {
            plugin._renderDelay = plugin.renderDelay;
            plugin.renderDelay  = 0;
        });

        component.getSchedulingView().timeAxisViewModel.suppressFit = true;
        component.timeAxis.autoAdjust                               = false;
        //expand grids in case they're collapsed
        component.normalGrid.expand();
        component.lockedGrid.expand();

        // change timespan/tick width according to provided settings
        me.setComponentRange(config);

        // For Tree grid, optionally expand all nodes
        if (me.expandAllBeforeExport && component.expandAll) {
            component.expandAll();
        }

        // resizes the component to fit it into specified paper size (depending on pagination rules)
        me.fitComponentIntoPage();

        //IE8 bug
        if (me.isBuffered() && Ext.isIE8) {
            me.normalView.bufferedRenderer.variableRowHeight = false;
            me.lockedView.bufferedRenderer.variableRowHeight = false;
        }

    },


    restoreComponent : function (component) {
        var me      = this;

        component   = component || me.getComponent();

        me.forEachTimeSpanPlugin(component, function (plugin) {
            plugin.renderDelay  = plugin._renderDelay;
            delete plugin._renderDelay;
        });

        // restore scheduler state
        me.restoreComponentState(component);

        //We need to update TimeAxisModel for layout fix #1334
        // component.getSchedulingView().timeAxisViewModel.update();

        // call template method
        me.exportConfig.afterExport && me.exportConfig.afterExport(component);
    },


    saveComponentState : function (component) {
        component           = component || this.getComponent();

        var me              = this,
            view            = component.getSchedulingView(),
            normalGrid      = component.normalGrid,
            lockedGrid      = component.lockedGrid;

        //values needed to restore original size/dates of component
        me.restoreSettings    = {
            width               : component.getWidth(),
            height              : component.getHeight(),
            rowHeight           : view.timeAxisViewModel.getViewRowHeight(),
            columnWidth         : view.timeAxisViewModel.getTickWidth(),
            startDate           : component.getStart(),
            endDate             : component.getEnd(),
            normalWidth         : normalGrid.getWidth(),
            normalLeft          : normalGrid.getEl().getStyle('left'),
            lockedWidth         : lockedGrid.getWidth(),
            lockedCollapse      : lockedGrid.collapsed,
            normalCollapse      : normalGrid.collapsed,
            autoAdjust          : component.timeAxis.autoAdjust,
            suppressFit         : view.timeAxisViewModel.suppressFit,
            restoreColumnWidth  : false,
            startIndex          : view.all ? view.all.startIndex : 0,
            centerDate          : component.getViewportCenterDate()
        };

    },


    restoreComponentState : function (component) {
        var me      = this;

        component   = component || me.getComponent();

        var config  = me.restoreSettings,
            view    = component.getSchedulingView();

        component.timeAxis.autoAdjust = config.autoAdjust;

        component.normalGrid.show();

        component.setWidth(config.width);
        component.setHeight(config.height);
        component.setTimeSpan(config.startDate, config.endDate);
        component.setTimeColumnWidth(config.columnWidth, true);

        view.setRowHeight(config.rowHeight);
        component.lockedGrid.show();

        component.normalGrid.setWidth(config.normalWidth);
        component.normalGrid.getEl().setStyle('left', config.normalLeft);
        component.lockedGrid.setWidth(config.lockedWidth);
        view.timeAxisViewModel.suppressFit = config.suppressFit;
        view.timeAxisViewModel.setTickWidth(config.columnWidth);

        if (config.lockedCollapse) {
            component.lockedGrid.collapse();
        }

        if (config.normalCollapse) {
            component.normalGrid.collapse();
        }

        if (me.getBufferedRenderer()) {

            me.scrollTo(config.startIndex);

            if (Ext.isIE8) {
                me.normalView.bufferedRenderer.variableRowHeight = true;
                me.lockedView.bufferedRenderer.variableRowHeight = true;
            }
        }
    },

    /**
     * Extracts the component content. On completion calls specified callback function providing an array of extracted pages as an argument.
     * @param {Sch.panel.SchedulerGrid/Sch.panel.SchedulerTree} component Component content of which to be extracted
     * @param {Object} config Configuration object. May contain the following properties:
     * @param {String} config.format Page format
     * @param {String} config.orientation Page orientation (either `portrait` or `landscape`)
     * @param {String} config.range Range of the panel to be exported. Options are `complete`, `current`, `date`. When `date` is specified there also has to be specified next two configs.
     * @param {Date} config.dateFrom Range start date. Used only when `config.range` is `date`
     * @param {Date} config.dateTo Range end date. Used only when `config.range` is `date`
     * @param {Boolean} config.showHeader Flag saying that page numbers header has to be shown
     * @param {Function} callback Function which is called after extraction of pages has completed. The callback will have the following arguments:
     * @param {Function} callback.pages An array with extracted pages
     * @param {Object} scope Scope for the callback function
     */
    extractPages : function (component, config, callback, scope) {
        var me          = this;

        // keep provided export config
        me.exportConfig = config;

        me.normalRows       = [];
        me.lockedRows       = [];
        me.extractedPages   = [];
        me.numberOfPages    = 0;
        me.lockedRowsHeight = 0;
        me.normalRowsHeight = 0;

        // calculates paper sizes based on provided parameters and DPI
        me.setPaperSize();

        // stores references to the component, its elements and makes a backup of its pre-export state
        me.setComponent(component, config);

        // prepares component to exporting (applies provided timespan etc.)
        me.prepareComponent(component, config);

        // launch template method
        config.beforeExport && config.beforeExport(component, me.ticks);

        me.callbacks        = {
            success : callback || Ext.emptyFn,
            scope   : scope || me
        };

        // fetch all component rows into temporary arrays
        // and call 'onRowsCollected' to collect them into pages and call 'onPagesExtracted' on completion
        new Ext.util.DelayedTask(function() {
            me.collectRows(0, me.onRowsCollected, me);
        }, me).delay(1);
    },

    /**
     * @protected
     * Finishes exporting process. Restores the component to its initial state and returns extracted pages by calling a provided callback.
     * @param  {Array[Object]} [pages] Extracted pages. If omitted then will take collected pages from {@link #extractedPages} array.
     */
    onPagesExtracted : function (pages) {
        var me  = this;

        // restore panel to initial state
        me.restoreComponent();
        // and return results
        me.submitPages(pages);
    },


    submitPages : function (pages) {
        var me          = this,
            callbacks   = me.callbacks;

        callbacks.success.call(callbacks.scope, me.renderPages(pages));
    },


    getCurrentPage : function () {
        return this.currentPage;
    },


    setCurrentPage : function (page) {
        this.currentPage = page;
    },


    getExpectedNumberOfPages : Ext.emptyFn,


    /**
     * Commits a filled page. Pushes the page into {@link #extractedPages resulted set of pages}.
     * Calls {@link #preparePageToCommit} for the final page DOM tweaking.
     * @param [config] An optional configuration object. Will also be passed to {@link #preparePageToCommit} method.
     */
    commitPage : function (config) {

        var me      = this;

        me.numberOfPages++;

        var pageBody = me.preparePageToCommit(config);

        var page    = Ext.apply({
            html    : pageBody.dom.innerHTML,
            number  : me.numberOfPages
        }, config);

        me.extractedPages.push(page);

        me.fireEvent('commitpage', me, page, me.numberOfPages, me.getExpectedNumberOfPages());
    },

    /**
     * @protected
     * Collects the locked grid row.
     * @param  {Element} item The locked grid row
     * @param  {Ext.data.Model} recordIndex Index of the record corresponding to the row.
     * @return {Object} Object keeping reference to the cloned row element and its height.
     */
    collectLockedRow : function (item, recordIndex) {
        var height  = Ext.fly(item).getHeight();

        this.lockedRowsHeight   += height;

        var result  = {
            height : height,
            row    : item.cloneNode(true),
            record : this.lockedView.getRecord(recordIndex)
        };

        this.lockedRows.push(result);

        return result;
    },

    /**
     * @protected
     * Collects the normal grid row.
     * @param  {Element} item The normal grid row
     * @param  {Ext.data.Model} recordIndex Index of the record corresponding to the row.
     * @return {Object} Object keeping reference to the cloned row element and its height.
     */
    collectNormalRow : function (item, recordIndex) {
        var height  = Ext.fly(item).getHeight();

        this.normalRowsHeight   += height;

        var result  = {
            height : Ext.fly(item).getHeight(),
            row    : item.cloneNode(true),
            record : this.normalView.getRecord(recordIndex)
        };

        this.normalRows.push(result);

        return result;
    },


    onRowsCollected : function () {
        throw 'Sch.plugin.exporter.AbstractExporter: [onRowsCollected] Abstract method called.';
    },


    /**
     * @private
     * Iterates by calling provided function asynchronously with a delay.
     * The delay duration is specified by {@link #iterateTimeout} config.
     * @param  {Function} fn    A function implementing a single iteration step.
     * @param  {Function} fn.next A callback function to be called to run next iteration step.
     * This will cause `fn` function launch. All arguments passed to {@link #fn.next} will be transfered to {@link #fn}.
     * @param  {[type]}   [scope] Scope for the callback function
     */
    iterateAsync : function (fn, scope) {
        var me      = this;

        scope       = scope || me;

        var next    = function () {
            var args    = arguments;

            // run iteration step asynchronously w/ delay
            new Ext.util.DelayedTask(function () {
                fn.apply(scope, [].concat.apply([ next ], args));
            }).delay(me.iterateTimeout);

        };

        next.apply(me, Ext.Array.slice(arguments, 2));
    },

    /**
     * @protected
     * Collects rows from the component. Launches the provided callback and passes collected rows as its arguments.
     * @param {int} index The index of the current row.
     * @param callback {Function} The callback function when extraction of rows has finished.
     */
    collectRows : function (startIndex, callback, scope) {

        var me          = this;

        if (me.isBuffered() && !me.scrolledToStartIndex) {
            // scroll to startIndex before rows collecting
            new Ext.util.DelayedTask(function() {
                me.scrollTo(startIndex, function () {
                    me.scrolledToStartIndex = true;
                    me.collectRows(0, callback, scope);
                }, me);
            }, me).delay(me.iterateTimeout);

            return;
        }

        var endIndex    = me.normalView.all.endIndex,
            count       = me.component.store.getCount(),
            normalRows  = me.normalView.all.slice(startIndex),
            lockedRows  = me.lockedView.all.slice(startIndex);

        for (var i = 0; i < lockedRows.length; i++) {
            me.collectLockedRow(lockedRows[i], startIndex + i);
        }

        for (i = 0; i < normalRows.length; i++) {
            me.collectNormalRow(normalRows[i], startIndex + i);
        }

        me.fireEvent('collectrows', me, startIndex, endIndex, count);

        if (me.isBuffered()) {

            if (endIndex + 1 < count) {

                new Ext.util.DelayedTask(function() {
                    me.scrollTo(endIndex + 1, function () {
                        me.collectRows(endIndex + 1, callback, scope);
                    }, me);
                }, me).delay(50);

            } else {
                me.scrollTo(0, function () {
                    me.scrolledToStartIndex = false;
                    callback.call(scope || me, me.lockedRows, me.normalRows);
                });
            }

        } else {
            me.scrolledToStartIndex = false;
            callback.call(scope || me, me.lockedRows, me.normalRows);
        }
    },

    /**
     * @private
     * Fills extracted pages `html` property before submitting them.
     * @param  {Array} [pages] Array of pages. By default {@link #extractedPages} is used.
     * @return {Array} Array of pages.
     */
    renderPages : function (pages) {
        var me  = this;

        pages   = pages || me.extractedPages;

        for (var i = 0, l = pages.length; i < l; i++) {
            var page    = pages[i];
            page.html   = me.applyPageTpl(page);
        }

        return pages;
    },

    /**
     * @protected
     * Builds HTML content of the page by applying provided page data to the {@link #tpl page template}.
     * @param  {Object} pageInfo Page data:
     * @param  {Object} pageInfo.html HTML code of the page
     * @param  {Object} pageInfo.number page number
     * @return {String}          HTML content of the page.
     */
    applyPageTpl : function (pageInfo) {
        var me  = this;
        return me.getTpl().apply(me.getPageTplData(pageInfo));
    },

    /**
     * @protected
     * Provides data to be applied to the {@link #tpl page template}.
     * @param  {Object} pageInfo Page data:
     * @param  {Object} pageInfo.html HTML code of the page
     * @param  {Object} pageInfo.number page number
     * @return {Object}      Data to be applied to the {@link #tpl page template}.
     */
    getPageTplData : function (pageInfo) {
        var me  = this;

        return {
            bodyClasses         : me.getBodyClasses(),
            bodyHeight          : me.printHeight + me.headerHeight,
            componentClasses    : me.getComponentClasses(),
            styles              : me.getStylesheets(),
            showHeader          : me.exportConfig.showHeader,
            HTML                : pageInfo.html,
            totalWidth          : me.paperWidth,
            total               : me.numberOfPages,
            number              : pageInfo.number,
            title               : pageInfo.number + ' of ' + me.numberOfPages
        };
    },

    /**
     * @protected
     * Resizes the component to fit it into specified paper size, export settings etc. (depending on implemented pagination rules).
     */
    fitComponentIntoPage : Ext.emptyFn,

    /**
     * @private
     * Function that retrieves the table body of the locked grid.
     * @param {Ext.dom.Element} [element] The fragment root for the selector. Defaults to current page.
     * @return {Ext.dom.Element} Table body of the locked grid.
     */
    getLockedGridBody : function (element) {
        element    = element || this.getCurrentPage();

        return element.select(this.lockedBodySelector + ' > ' + this.tableSelector).first();
    },

    /**
     * @private
     * Retrieves the table body of the normal grid.
     * @param {Ext.dom.Element} [element] The root element to retrieve from. Defaults to current page.
     * @return {Ext.dom.Element} Table body of the normal grid.
     */
    getNormalGridBody : function (element) {
        element = element || this.getCurrentPage();

        return element.select(this.normalBodySelector + ' > ' + this.tableSelector).first();
    },


    emptyLockedGrid : function (element) {
        this.getLockedGridBody(element).select(this.lockedView.getItemSelector()).remove();
    },


    fillGrids : function (lockedRows, normalRows, clone, append) {
        var me  = this;

        me.fillLockedGrid(lockedRows, clone, append);
        me.fillNormalGrid(normalRows, clone, append);
    },


    fillLockedGrid : function (rows, clone, append) {
        var me  = this;

        if (!append) me.emptyLockedGrid();

        me.appendRows(me.getLockedGridBody(), rows || me.lockedRows, clone);
    },


    fillNormalGrid : function (rows, clone, append) {
        var me  = this;

        if (!append) me.emptyNormalGrid();

        me.appendRows(me.getNormalGridBody(), rows || me.normalRows, clone);
    },


    appendRows : function (node, children, clone) {
        var dom     = node.dom;

        for (var i = 0, l = children.length; i < l; i++) {
            dom.appendChild(clone ? children[i].row.cloneNode(true) : children[i].row);
        }
    },


    emptyNormalGrid : function (element) {
        this.getNormalGridBody(element).select(this.normalView.getItemSelector()).remove();
    },


    getRowHeight : function () {
        return this.view.timeAxisViewModel.getViewRowHeight();
    },


    /**
     * @private
     * Returns full width and height of both grids.
     * @return {Object} Object containing `width` and `height` properties.
     */
    getTotalSize : function() {
        return {
            width   : this.getTotalWidth(),
            height  : this.getTotalHeight()
        };
    },

    /**
     * @private
     * Returns full height of the component.
     * @return {Number} Full height of the component.
     */
    getTotalHeight : function () {
        var me  = this,
            viewHeight;

        if (me.isBuffered()) {
            viewHeight  = me.bufferedHeightMargin + me.normalRowsHeight;
        } else {
            viewHeight  = me.lockedView.getEl().down(me.tableSelector).getHeight();
        }

        return me.headerHeight + viewHeight;
    },

    /**
     * @private
     * Returns full width of the component.
     * @return {Number} Full width of both grids.
     */
    getTotalWidth : function () {
        return this.getLockedGridWidth() + this.normalGrid.body.down(this.tableSelector).getWidth();
    },


    getLockedGridWidth : function () {
        return this.lockedHeader.getEl().first().getWidth();
    },


    getNormalGridWidth : function () {
        return this.normalHeader.getEl().first().getWidth();
    },


    /**
     * @protected
     * Performs last changes to {@link #getCurrentPage the current page} being extracted before it's pushed into {@link #extractedPages} array.
     * @param {Object} [config] Optional configuration object.
     * @return {Ext.dom.Element} element Element holding the page.
     */
    preparePageToCommit : function () {
        //create empty div that will temporarily hold our panel current HTML
        var frag        = this.getCurrentPage(),
            component   = this.component,
            lockedGrid  = component.lockedGrid,
            normalGrid  = component.normalGrid;

        frag.el.select('.sch-remove').remove();

        var get             = function (s) { var el = frag.select('#' + s).first(); return el && el.dom; },
            elapseWidth     = function (el) { if (el) el.style.width  = '100%'; },
            elapseHeight    = function (el) { if (el) el.style.height = '100%'; };

        var normalBody      = frag.select(this.normalBodySelector).first();
        normalBody.dom.style.top    = '0px';

        var lockedBody      = frag.select(this.lockedBodySelector).first();
        lockedBody.dom.style.top    = '0px';

        // we elapse some elements width and/or height

        var lockedElements  = [
            get(component.id + '-targetEl'),
            get(component.id + '-innerCt'),
            get(lockedGrid.id),
            get(lockedGrid.body.id),
            get(lockedGrid.view.el.id)
        ];

        Ext.Array.each(lockedElements, elapseHeight);

        elapseWidth(lockedElements[0]);
        elapseWidth(lockedElements[1]);

        elapseWidth(get(normalGrid.headerCt.id));

        Ext.Array.each([
            get(normalGrid.id),
            get(normalGrid.body.id),
            get(normalGrid.getView().id)
        ], function(el) {
            if (el) {
                el.style.height = '100%';
                el.style.width  = '100%';
            }
        });

        return frag;
    },


    cloneElement : function (el) {
        return new Ext.dom.Element(Ext.core.DomHelper.createDom({
            tag     : 'div',
            html    : el.dom.innerHTML
        }));
    },


    /**
     * Starts a new page. Initializes {@link #currentPage} with a copy of the component that will
     * be filled with collected rows based on implemented pagination rules.
     * @param  {Ext.dom.Element} [pattern] Element to make a copy of. This is optional by default will make a copy of {@link #getComponent the component}.
     */
    startPage : function (pattern) {
        var me      = this;

        // make a detached copy of the component body
        var copy    = me.cloneElement(pattern || me.getComponent().body);

        // and put it into storedFragment
        me.setCurrentPage(copy);
    },

    scrollTo : function (position, callback) {
        var me = this;

        me.lockedView.bufferedRenderer.scrollTo(position, false, function () {
            me.normalView.bufferedRenderer.scrollTo(position, false, callback);
        });

    },

    removeNode : function (el) {
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
    }

});
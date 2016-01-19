Ext.define('SampleApp.view.AppHeader' ,{
    extend: 'Ext.container.Container',
    alias : 'widget.AppHeader',
	id: 'app-header',
	region: 'north',
	height: 55,
	html	: 'Ext JS MVC - <span class="subtitle">Sample application</span>'
});
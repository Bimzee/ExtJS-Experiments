/*
 * Ext Scheduler 1.6
 * Copyright(c) 2009-2010 Mats Bryntse Consulting
 * mats@ext-scheduler.com
 * http://www.ext-scheduler.com/license.html
 *
 */

/*
 * To analyze possible errors in your setup, include this on your HTML page and use firebug (or any other console application) to execute line below:
 * >
 * > schedulerDiagnostics();
 * > ...
 */ 
function schedulerDiagnostics() {
    var log;
    if (console && console.log) {
        log = console.log;
    } else {
        if (!window.schedulerDebugWin) {
            window.schedulerDebugWin = new Ext.Window({
                height:400,
                width: 500,
                bodyStyle:'padding:10px',
                closeAction : 'hide',
                autoScroll:true
            });
        }
        window.schedulerDebugWin.show();
        schedulerDebugWin.update('');
        log = function(text){ schedulerDebugWin.update((schedulerDebugWin.body.dom.innerHTML || '') + text + '<br/>');};
    }

    var els = Ext.select('.sch-schedulerpanel');
    
    if (els.getCount() === 0) log('No scheduler component found');
    
    var s = Ext.getCmp(els.elements[0].id),
        es = s.eventStore;

    log('Scheduler view start: ' + s.getStart() + ', end: ' + s.getEnd());
    
    if (!s.store) { log('No store configured'); return; }
    if (!es) {log('No event store configured'); return; }
    
    if (s.autoViews) {
        log('Autoviews configured. Grid will reconfigure itself when you load the store using the start/end param values.');
        
        if (!es.lastOptions) {
            log('Event store has not been loaded.');
            return;
        } else if (!es.lastOptions.params[s.startParamName] || 
                   !es.lastOptions.params[s.endParamName]) {
            log('Store was loaded with incorrect date parameters. The start/end param names must be set on the schedulerpanel as "startParamName" and "endParamName".');
            return;
        }
    }
    
    log(s.store.getCount() + ' records in the resource store'); 
    log(es.getCount() + ' records in the eventStore'); 
    log(Ext.select(s.eventSelector).getCount() + ' events present in the DOM'); 
    
    if (es.getCount() > 0) {
        if (!es.getAt(0).get('StartDate') || !(es.getAt(0).get('StartDate') instanceof Date)) {
            log ('The eventStore reader is misconfigured - The StartDate field is not setup correctly, please investigate');
            return;
        }
        
        if (!es.getAt(0).get('EndDate') || !(es.getAt(0).get('EndDate') instanceof Date)) {
            log('The eventStore reader is misconfigured - The EndDate field is not setup correctly, please investigate');
            return;
        }
        
        if (!es.fields.get('ResourceId')) {
            log('The eventStore reader is misconfigured - The ResourceId field is not present');
            return;
        }
        
        log('Records in the event store:');
        es.each(function(r, i) {
            log((i + 1) + '. Start:' + r.get('StartDate') + ', End:' + r.get('EndDate') + ', ResourceId:' + r.get('ResourceId'));
        });
    } else {
        log('Event store has no data.');
    }
    
    if (s.store.getCount() > 0) {
        log('Records in the resource store:');
        s.store.each(function(r, i) {
            log((i + 1) + '. Id:' + r.get('Id'));
            return;
        });
        if (!s.store.fields.get('Id')) {
            log('The resource store reader is misconfigured - The Id field is not present');
            return;
        }
    } else {
        log('Resource store has no data.');
        return;
    }
    
    log('Everything seems to be setup ok!');
}
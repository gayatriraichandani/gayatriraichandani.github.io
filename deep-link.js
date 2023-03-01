function DeepLinker(options) {
    if (!options) {
        throw new Error('no options')
    }

    var hasFocus = true;
    var didHide = false;

    // window is blurred when dialogs are shown
    function onBlur() {
        console.log('blurred');
        hasFocus = false;
    };

    // document is hidden when native app is shown or browser is backgrounded
    function onVisibilityChange(e) {
        if (e.target.visibilityState === 'hidden') {
            console.log('hidden');
            didHide = true;
        }
    };

    // window is focused when dialogs are hidden, or browser comes into view
    function onFocus() {
        if (didHide) {
            console.log('didHide');
            if (options.onReturn) {
                options.onReturn();
            }

            didHide = false; // reset
        } else {
            console.log('didHide false');
            // ignore duplicate focus event when returning from native app on
            // iOS Safari 13.3+
            if (!hasFocus && options.onFallback) {
                console.log('i am here');
                // wait for app switch transition to fully complete - only then is
                // 'visibilitychange' fired
                setTimeout(function() {
                    console.log('now here');
                    // if browser was not hidden, the deep link failed
                    if (!didHide) {
                        options.onFallback();
                    }
                }, 1000);
            }
        }

        hasFocus = true;
    };

    // add/remove event listeners
    // `mode` can be "add" or "remove"
    function bindEvents(mode) {
        [
            [window, 'blur', onBlur],
            [document, 'visibilitychange', onVisibilityChange],
            [window, 'focus', onFocus],
        ].forEach(function(conf) {
            conf[0][mode + 'EventListener'](conf[1], conf[2]);
        });
    }

    // add event listeners
    bindEvents('add');

    // expose public API
    this.destroy = bindEvents.bind(null, 'remove');
    this.openURL = function(url) {
        // it can take a while for the dialog to appear
        var dialogTimeout = 500;

        setTimeout(function() {
            console.log('openURL');
            if (hasFocus && options.onIgnored) {
                console.log('hasFocus: ',hasFocus);
                console.log('options.onIgnored: ',options.onIgnored);
                options.onIgnored();
            }
        }, dialogTimeout);

        window.location = url;
    };
}

/* usage */

var url = 'fb://profile/240995729348595';
var badURL = 'lksadjgajsdhfaskd://slkdfs';

var linker = new DeepLinker({
    onIgnored: function() {
        console.log('browser failed to respond to the deep link');
        window.location = "https://www.google.com/";
    },
    onFallback: function() {
        console.log('dialog hidden or user returned to tab');
    },
    onReturn: function() {
        console.log('user returned to the page from the native app');
    },
});

// linker.openURL(url);
function DeepLinker(options) {
    if (!options) {
        throw new Error('no options')
    }

    var hasFocus = true;
    var didHide = false;

    // window is blurred when dialogs are shown
    function onBlur() {
        console.log('BLURRED');
        hasFocus = false;
    };

    // document is hidden when native app is shown or browser is backgrounded
    function onVisibilityChange(e) {
        console.log('HIDDEN: ', e.target.visibilityState);
        if (e.target.visibilityState === 'hidden') {
            didHide = true;
        } else {
            didHide = false;
        }
    };

    // window is focused when dialogs are hidden, or browser comes into view
    function onFocus() {
        console.log('FOCUSSED');
        if (didHide) {
            console.log('onfocus() didHide: ', didHide);
            if (options.onReturn) {
                options.onReturn();
            }

            didHide = false; // reset
        } else {
            console.log('onfocus() didHide: ', didHide);
            // ignore duplicate focus event when returning from native app on
            // iOS Safari 13.3+
            if (!hasFocus && options.onFallback) {
                console.log('onfocus() hasFocus: ', hasFocus);
                // wait for app switch transition to fully complete - only then is
                // 'visibilitychange' fired
                setTimeout(function() {
                    console.log('onfocus() settimeout');
                    // if browser was not hidden, the deep link failed
                    if (!didHide) {
                        console.log('onfocus() didHide:', didHide);
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
        ].forEach(conf => {
            conf[0][mode + 'EventListener'](conf[1], conf[2]);
        });
    }

    // add event listeners
    bindEvents('add');

    // expose public API
    this.destroy = bindEvents.bind(null, 'remove');
    this.openURL = url => {
        // it can take a while for the dialog to appear
        var dialogTimeout = 500;
        console.log('useragent: ', navigator.userAgent);
        setTimeout(() => {
            console.log('openURL');
            console.log('hasFocus: ',hasFocus);
            if (hasFocus && options.onIgnored) {
                console.log('options.onIgnored: ',options.onIgnored);
                options.onIgnored();
            }
        }, dialogTimeout);

        window.location = url;
    };
}


const linker = new DeepLinker({
    onIgnored: () => {
        console.log('browser failed to respond to the deep link');
        window.location = "https://www.google.com/";
    },
    onFallback: () => {
        console.log('dialog hidden or user returned to tab');
    },
    onReturn: () => {
        console.log('user returned to the page from the native app');
    },
});

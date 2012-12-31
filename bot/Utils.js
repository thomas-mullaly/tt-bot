(function () {
    "use strict";

    exports.proxy = function (context, fn) {
        return function () {
            fn.apply(context, arguments);
        };
    };
}).call(this);
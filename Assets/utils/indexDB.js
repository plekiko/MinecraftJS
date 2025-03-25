!(function () {
    function e(t, o) {
        return n
            ? void (n.transaction("s").objectStore("s").get(t).onsuccess =
                  function (e) {
                      var t = (e.target.result && e.target.result.v) || null;
                      o(t);
                  })
            : void setTimeout(function () {
                  e(t, o);
              }, 100);
    }
    var t =
        window.indexedDB ||
        window.mozIndexedDB ||
        window.webkitIndexedDB ||
        window.msIndexedDB;
    if (!t) return void console.error("indexDB not supported");
    var n,
        o = { k: "", v: "" },
        r = t.open("d2", 1);
    (r.onsuccess = function (e) {
        n = this.result;
    }),
        (r.onerror = function (e) {
            console.error("indexedDB request error"), console.log(e);
        }),
        (r.onupgradeneeded = function (e) {
            n = null;
            var t = e.target.result.createObjectStore("s", { keyPath: "k" });
            t.transaction.oncomplete = function (e) {
                n = e.target.db;
            };
        }),
        (window.ldb = {
            get: e,
            set: function (e, t) {
                (o.k = e),
                    (o.v = t),
                    n.transaction("s", "readwrite").objectStore("s").put(o);
            },
            remove: function (key, callback) {
                // Use a transaction to delete the key and provide a callback for completion
                const transaction = n.transaction("s", "readwrite");
                const store = transaction.objectStore("s");
                const request = store.delete(key);

                request.onsuccess = function () {
                    if (callback) callback(null); // Success, no error
                };
                request.onerror = function (e) {
                    if (callback) callback(e.target.error); // Pass error to callback
                };
            },
        });
})();

function getFromLdb(key) {
    return new Promise((resolve, reject) => {
        ldb.get(key, (data) => {
            if (data !== undefined && data !== null) {
                resolve(data); // Success case
            } else {
                reject(new Error(`No data found for key: ${key}`)); // Error case
            }
        });
    });
}

function deleteFromLdb(key) {
    return new Promise((resolve, reject) => {
        ldb.remove(key, (err) => {
            if (err) {
                reject(
                    new Error(`Failed to delete key ${key}: ${err.message}`)
                );
            } else {
                resolve(); // Successfully deleted
            }
        });
    });
}

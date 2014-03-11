var page = require('webpage').create();
var url = 'http://localhost:8080/native.html';
page.open(url, function (status) {
  setTimeout(function () {
    var response = page.evaluate(function () {
      return window.document.querySelector(".alert .bar").innerHTML
    });
    console.log(response);
    phantom.exit();
  }, 2000);
});
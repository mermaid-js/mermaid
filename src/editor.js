function decodeHTMLEntities (str) {
    if(str && typeof str === 'string') {
      // strip script/html tags
      var element = document.querySelector('.editor');
        
      str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
      str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
      element.innerHTML = str;
      str = element.textContent;
      element.textContent = '';
    }

    return str;
}

var mermaidEditor =  {
    $ : document.querySelector,
    textField : '',
    submit : '',
    graph : '',

    init: function () {

        document.querySelector('.button').addEventListener('click', function () {
            mermaidEditor.update();
        }.bind(this));
    },
    
    update: function () {
        var txt = document.querySelector('.editor').value;
        txt = txt.replace(/>/g,'&gt;');
        txt = txt.replace(/</g,'&lt;');
        txt = decodeHTMLEntities(txt).trim();

        document.querySelector('.mermaid').innerHTML = txt;
        global.mermaid.init();
        document.querySelector('.editor').value = txt;
    }
};

document.addEventListener('DOMContentLoaded', function () {

    mermaidEditor.init();

}, false);

exports = mermaidEditor;
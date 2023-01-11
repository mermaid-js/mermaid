```html
<meta charset="utf-8" />
<title>vue-sequence demo</title>
<script src="https://unpkg.com/vue@2.6.12/dist/vue.js"></script>
<script src="https://unpkg.com/vuex@3.6.2/dist/vuex.js"></script>
<script src="./vue-sequence.umd.min.js"></script>

<link rel="stylesheet" href="./vue-sequence.css" />

<div id="mounting-point"></div>

<script>
  window.addEventListener('load', function (event) {
    console.log('window loaded');
    Vue.use(Vuex);
    let { SeqDiagram, Store } = window['vue-sequence'];
    let storeConfig = Store();
    storeConfig.state.code = 'A.method';
    Vue.component('seq-diagram', SeqDiagram);
    window.app = new Vue({
      el: document.getElementById('mounting-point'),
      store: new Vuex.Store(storeConfig),
      render: (h) => h('seq-diagram'),
    });
  });
</script>
```

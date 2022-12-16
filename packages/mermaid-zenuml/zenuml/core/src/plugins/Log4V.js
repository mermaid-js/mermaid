/* eslint-disable no-console,no-unused-vars */
let Log4V = {
  install: function (vue, options) {
    vue.mixin({
      beforeCreate() {
        // console.log('Before creating a component', this.$options.name, this.$options)
      },
      created() {
        // console.log('A component has been created', this.$options.name)
      },
      beforeMount() {
        console.log('Before mounting a component', this.$options.name);
      },
      mounted() {
        console.log('A component has been mounted', this.$options.name, this);
      },
      beforeUpdate() {
        console.log('Before updating a component', this.$options.name);
      },
      updated() {
        console.log('A component has been updated', this.$options.name, this);
      },
      destroyed() {
        // console.log('A component has been destroyed', this.$options.name, this.$options)
      },
    });
  },
};

export default Log4V;

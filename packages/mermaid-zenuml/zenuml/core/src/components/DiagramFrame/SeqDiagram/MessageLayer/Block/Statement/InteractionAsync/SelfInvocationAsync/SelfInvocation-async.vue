<template>
  <!-- style border-width means not to be overridden. -->
  <div class="message self flex items-start" style="border-width: 0">
    <svg class="arrow text-skin-message-arrow" width="34" height="34">
      <polyline class="stroke-current stroke-2 fill-none" points="0,2 28,2 28,25 1,25"></polyline>
      <polyline class="head stroke-current stroke-2 fill-none" points="11,19 1,25 11,31"></polyline>
      <!--TODO: What is the below line used for?-->
      <!--<polyline class="closed" points="28,32 28,18"></polyline>-->
    </svg>
    <label class="name px-px hover:text-skin-message-hover hover:bg-skin-message-hover">{{content}}</label>
  </div>
</template>

<script type="text/babel">
  export default {
    name: 'self-invocation-async',
    props: ['content']
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .message.self {
    /* InteractionBorderWidth */
    transform: translateX(-5px);
  }

</style>

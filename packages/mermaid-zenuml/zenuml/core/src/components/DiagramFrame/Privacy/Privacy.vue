<template>
  <div>
    <div class="tooltip bottom whitespace-normal" data-tooltip="We (the vendor) do not have access to your data. The diagram is generated in this browser.">
      <svg class="fill-current h-6 w-6 m-auto" xmlns="http://www.w3.org/2000/svg" xml:space="preserve"
           viewBox="0 0 214.27 214.27"><path d="M196.926 55.171c-.11-5.785-.215-11.25-.215-16.537a7.5 7.5 0 0 0-7.5-7.5c-32.075 0-56.496-9.218-76.852-29.01a7.498 7.498 0 0 0-10.457 0c-20.354 19.792-44.771 29.01-76.844 29.01a7.5 7.5 0 0 0-7.5 7.5c0 5.288-.104 10.755-.215 16.541-1.028 53.836-2.436 127.567 87.331 158.682a7.495 7.495 0 0 0 4.912 0c89.774-31.116 88.368-104.849 87.34-158.686zm-89.795 143.641c-76.987-27.967-75.823-89.232-74.79-143.351.062-3.248.122-6.396.164-9.482 30.04-1.268 54.062-10.371 74.626-28.285 20.566 17.914 44.592 27.018 74.634 28.285.042 3.085.102 6.231.164 9.477 1.032 54.121 2.195 115.388-74.798 143.356z"/>
        <path
            d="m132.958 81.082-36.199 36.197-15.447-15.447a7.501 7.501 0 0 0-10.606 10.607l20.75 20.75a7.477 7.477 0 0 0 5.303 2.196 7.477 7.477 0 0 0 5.303-2.196l41.501-41.5a7.498 7.498 0 0 0 .001-10.606 7.5 7.5 0 0 0-10.606-.001z"/></svg>
    </div>
  </div>
</template>

<script>
export default {
  name: "Privacy",
}
</script>

<style scoped>

.tooltip {
  cursor: pointer;
  position: relative;
  display: block;
  width: 100%;
  text-align: center;
  z-index: 10;
}
.tooltip span {
  border-bottom: 1px dotted;
}
.tooltip:after {
  display: none;
  content: attr(data-tooltip);
  background: #e8e9e9;
  max-width: 500px;
  width: 200px;
  position: absolute;
  left: -200px;
  right: 0;
  margin: auto;
  opacity: 0;
  height: auto;
  font-size: 14px;
  padding: 10px;
  border-radius: 4px;
  color: #111;
  text-align: left;
}

.tooltip.bottom:after {
  top: 80%;
  transition: opacity 0.3s ease 0.3s, top 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s;
}
.tooltip.bottom:hover:after {
  display: block;
  top: 130%;
  opacity: 1;
}

</style>

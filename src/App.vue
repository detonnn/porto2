<style>
 @import '../public/frontend/assets/css/swiper-bundle.min.css';
 @import '../public/frontend/assets/css/terminal.css';
 @import '../public/frontend/assets/css/lenis.css';
</style>

<template>
  <master></master>
</template>

<script>

import Master from "./views/MasterView.vue"

export default {
  mounted() {
    // Lenis has to load and execute BEFORE main.js runs, otherwise
    // `Lenis` is undefined when main.js tries to construct it.
    let LenisScript = document.createElement("script");
    LenisScript.setAttribute("src", "./frontend/assets/js/lenis.min.js");
    LenisScript.onload = () => {
      let Script = document.createElement("script");
      Script.setAttribute("src", "./frontend/assets/js/main.js");
      document.head.appendChild(Script);
    };
    document.head.appendChild(LenisScript);
  },
  components: { Master }
};

</script>

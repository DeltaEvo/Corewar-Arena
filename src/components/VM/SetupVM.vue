<template>
  <div class="vm-setup">
    <section class="selector">
      <div>
        <champion-selector
          :max="6"
          :champions="vm.champions"
          @load="d => vm.loadChampion(d)"
        ></champion-selector>
      </div>
    </section>
    <div class="play">
      <ratio>
        <button @click="start">
          <icon class="icon" icon="play" />
        </button>
      </ratio>
    </div>
    <section class="panel">
      <div class="labeled-input">
        <label>VM Version:</label>
        <div style="width: 100%">
          <versions v-model="version" />
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import ChampionSelector from "../ChampionSelector.vue";
import Ratio from "../Ratio.vue";
import Versions from "../Versions.vue";

export default {
  props: ["vm"],
  data() {
    return {
      version: null
    };
  },
  methods: {
    start() {
      if (this.version.url) this.vm.start(this.version.url);
      else alert("No version selected");
    }
  },
  components: {
    ChampionSelector,
    Ratio,
    Versions
  }
};
</script>

<style lang="stylus">
.vm-setup {
  display: flex;
  height: 100vh;
  overflow: hidden;

  & > .selector {
    width: 70%;
    display: flex;
    justify-content: center;
    align-items: center;

    & > div {
      width: 100%;
      box-sizing: border-box;
      max-width: 100vh;
      padding: 7.5%;
    }
  }

  & > .play {
    display: flex;
    align-items: center;

    button {
      cursor: pointer;
      display: block;
      width: 100%;
      height: 100%;
      border: 2px solid tomato;
      background: white;
      border-radius: 50%;
      padding: 0;
      box-sizing: border-box;

      & > .icon {
        color: tomato;
        width: 100%;
        height: 100%;
        padding: 30%;
        box-sizing: border-box;
      }

      &:focus {
        outline: none;
      }
    }
  }

  & > .play > .box {
    position: absolute;
    transform: translateX(-50%)
    width: 7.5%;
  }

  & > .panel {
    width: 30%;
    background: tomato;
    padding: 32px;
    box-sizing: border-box;
    color: white;

    .labeled-input {
      display: flex;
      align-items: center;
      white-space: nowrap;

      & > * {
        padding: 0 8px;
      }
    }
  }
}
</style>
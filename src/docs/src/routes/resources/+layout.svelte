<script>
  import { page } from "$app/stores"
  import Footer from "$components/Footer.svelte"
  import Ads from "$components/Ads.svelte"
  export let data
  let { tags } = data
</script>

<div class="flex flex-col-reverse justify-between gap-6 xl:flex-row" dir="ltr">
  <div class="w-full px-4 md:px-20" dir="ltr">
    <nav class="tabs tabs-lifted tabs-lg my-14 flex-nowrap whitespace-nowrap">
      <a
        href="/resources/videos/"
        class={`tab ${$page.url.pathname.startsWith("/resources/videos/") ? "tab-active" : ""}`}>
        Videos
      </a>
      <a
        href="/resources/articles/"
        class={`tab ${$page.url.pathname.startsWith("/resources/articles/") ? "tab-active" : ""}`}>
        Articles
      </a>
      <a
        href="/resources/courses/"
        class={`tab ${$page.url.pathname.startsWith("/resources/courses/") ? "tab-active" : ""}`}>
        Courses
      </a>
      <span class="tab"></span>
    </nav>
    <slot />
  </div>
  <Ads slot="carbon2" />
</div>
<Footer />

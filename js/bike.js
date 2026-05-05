
export {}

for (const e of document.querySelectorAll('.js-bike')) {
  const d = e.dataset
  const prev = e.innerHTML
  e.innerHTML = `
<div class="tourbox">
  <div style="0 5px 5px 5px">
    ⭐
    <a href="/ciclo/${d.name}.htm">${d.title}</a>
  </div>
  <a class="hoverShower2" href="/ciclo/${d.name}-overview.jpg">
    <span class="showOnHover2 tourOverlay">
      ${prev}
      <hr/>
      <h5>${d.miles} miles</h5>
    </span>
    <img src="/ciclo/${d.name}-thumb.jpg"/>
  </a>
</div>`
}

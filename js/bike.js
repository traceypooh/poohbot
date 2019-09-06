
$($('.js-bike').each((idx, e) => {
  // console.log(e)
  // console.log(e.dataset)
  const d = e.dataset
  e.innerHTML = `
<div class="tourbox">
  <div style="0 5px 5px 5px">
    ⭐
    <a href="/ciclo/${d.name}.htm">${d.title}</a>
  </div>
  <a class="hoverShower2" href="/ciclo/${d.name}-overview.jpg">
    <span class="showOnHover2 tourOverlay">
      ${e.innerHTML}
      <hr/>
      <h5>${d.miles} miles</h5>
    </span>
    <img src="/ciclo/${d.name}-thumb.jpg"/>
  </a>
</div>`
}))

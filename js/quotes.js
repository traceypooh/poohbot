
$.getJSON('/js/quotes.json', (resp) => {
  log(resp)
  let htm = ''
  for (let longy = 0; longy < 2; longy++) {
    let i = -1
    const qs = (longy ? resp['long'] : resp['short'])
    for (const q of qs) {
      i += 1
      htm += `
<div ${(longy && i === (qs.length - 1) ? 'style="clear:left"' : 'class="quote"')}>
  <dl>
    <dt>
      ${q['q']}
    </dt>
    <dd> - ${q['a']}<br/>
      ${(q['href'] ? `<a href="${q['href']}">${q['anchor']}</a>` : '')}
    </dd>
  </dl>
</div>
${(((i + 1) % 3 === 0 || i === (qs.length - 1)) ? '<br clear="left"/>' :'')}`
    }
  }
  $('#js-quotes').html(htm)
})

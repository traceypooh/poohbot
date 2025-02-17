/* eslint-disable no-plusplus */
/* eslint-disable no-console */

let retries = 1

const main = () => {
  console.log(`try ${retries}`)
  fetch('/js/quotes.json').then((res) => res.json()).then((resp) => {
    console.log({ resp })
    let htm = ''
    for (let longy = 0; longy < 2; longy++) {
      let i = -1
      const qs = (longy ? resp.long : resp.short)
      for (const q of qs) {
        i += 1
        htm += `
  <div ${(longy && i === (qs.length - 1) ? 'style="clear:left"' : 'class="quote"')}>
    <dl>
      <dt>
        ${q.q}
      </dt>
      <dd> - ${q.a}<br/>
        ${(q.href ? `<a href="${q.href}">${q.anchor}</a>` : '')}
      </dd>
    </dl>
  </div>
  ${(((i + 1) % 3 === 0 || i === (qs.length - 1)) ? '<br clear="left"/>' : '')}`
      }
    }

    const el = document.querySelector('#js-quotes') ||
      // if using blogtini.com, we have to find this through a shadow doms..
      document.querySelector('bt-post-full')?.shadowRoot?.querySelector('#js-quotes')

    if (el)
      el.innerHTML = htm
    else if (retries++ <= 3)
      setTimeout(main, 1000 * retries)
  })
}

document.addEventListener('DOMContentLoaded', main)

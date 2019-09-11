$.get('/js/motion-jpeg.js', (js) => {
  const htm = $('#bodydiv').html()
  $('#src').text(`${htm}<script>${js}</` + `script>`)
})

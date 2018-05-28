$(function() {
  if (location.pathname.split('/')[1] !== '') {
    $('a[href^="/' + location.pathname.split('/')[1] + '"]').addClass('active')
  }
})

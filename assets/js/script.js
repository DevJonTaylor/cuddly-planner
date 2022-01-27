// TODO:  Display Date at the top of the page.
// TODO:  Create time blocks for standard business hours. (9-5)
// TODO:  Time blocks are editablecontent.
// TODO:  Confirm save modal.
// TODO:  localStorage to save the data on refresh.

// The format used to display the date
const momentDateFormat = 'dddd, MMMM Do';

jQuery(function($) {
  // Displaying current date at top of the page.
  $('#currentDay').text(moment().format(momentDateFormat));
});
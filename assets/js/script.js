// TODO:  Display Date at the top of the page.
// TODO:  Create time blocks for standard business hours. (9-5)
// TODO:  Time blocks are contenteditable.
// TODO:  Confirm save modal.
// TODO:  localStorage to save the data on refresh.
/*
<section className="row time-block">
  <article className="hour col-1">9AM</article>
  <article className="future col-10 description">
    <p contentEditable="true">Sup</p>
  </article>
  <button className="saveBtn col-1"><i className="fa fa-save"></i></button>
</section>
*/

class TimeBlock {
  constructor(momentObj) {
    this.moment = momentObj === undefined ? moment() : momentObj;
    this.container = jQuery(`<section class="row time-block" data-block-id="${this.id}">
    <article class="hour col-1"></article>
    <article class="col-10 past pt-1" contenteditable="true"></article> 
    <button class="saveBtn col-1"><i class="fa fa-save"></i></button>
</section>`)
    this.messageStr = '';
    this.isEditing = false;
    this.isUnsaved = false;
    this.updateDisplay();
  }

  get hourElement() {
    return this.container.find('.hour');
  }

  get messageElement() {
    return this.container.find('[contenteditable]');
  }

  get buttonElement() {
    return this.container.find('.saveBtn');
  }

  appendTo(container) {
    // Using jQuery here to allow selectors, elements, and jQuery objects.
    jQuery(container).append(this.container);
  }

  get message() {
    return this.messageStr;
  }

  set message(str) {
    this.messageStr = str;
  }

  get id() {
    return this.moment.format('hhA');
  }

  get isPast() {
    return this.moment.hours() < moment().hours();
  }

  get isFuture() {
    return this.moment.hours() > moment().hours();
  }

  updateDisplay() {
    this.container.attr('data-block-id', this.id);
    this.hourElement.text(this.id);

    if(!this.isEditing) this.messageElement.text(this.messageStr);
    if(!this.isUnsaved) this.messageElement.removeClass('font-weight-bold');
    else this.messageElement.addClass('font-weight-bold');
    if(this.isPast) {
      this.messageElement
        .removeClass('present', 'future')
        .addClass('past')
    } else if(this.isFuture) {
      this.messageElement
        .removeClass('present', 'past')
        .addClass('future')
    } else {
      this.messageElement
        .removeClass('past', 'future')
        .addClass('present')
    }
  }

  toObject() {
    return {
      date: this.moment.format('x'),
      message: this.messageStr
    }
  }

  toString() {
    return JSON.stringify(this.toObject());
  }

  editing(isEditing) {
    this.isEditing = isEditing;
  }

  unsaved(isUnsaved) {
    this.isUnsaved = isUnsaved;
  }

  save() {
    this.messageStr = this.messageElement.text();
    this.isEditing = false;
    this.isUnsaved = false;
    this.updateDisplay();
  }

  revert() {
    this.isEditing = false;
    this.isUnsaved = false;
    this.updateDisplay();
  }
}

class TimeBlocks {
  constructor(container) {
    this.container = jQuery(container);
    this.timeBlocks = {};
    this.interval = setInterval(this.updateDisplay.bind(this), 1000);
  }

  toObject() {
    let timeBlocks = [];
    for(let k in this.timeBlocks) {
      timeBlocks.push(this.timeBlocks[k].toObject());
    }

    return timeBlocks;
  }

  toString() {
    return JSON.stringify(this.toObject());
  }

  updateDisplay() {
    for(let k in this.timeBlocks) {
      this.timeBlocks[k].updateDisplay();
    }
  }

  timeBlock(momentObj) {
    let timeBlock = new TimeBlock(momentObj);
    timeBlock.appendTo(this.container);
    this.timeBlocks[timeBlock.id] = timeBlock;
  }

  getTimeBlock(id) {
    return this.timeBlocks[id];
  }

  editing(id) {
    this.getTimeBlock(id).editing(true);
  }

  isEditing(id) {
    return this.getTimeBlock(id).isEditing;
  }

  isDone(id) {
    this.getTimeBlock(id).unsaved(true)
  }

  save(id) {
    this.getTimeBlock(id).save();
  }

  revert(id) {
    this.getTimeBlock(id).revert();
  }

  getElementText(id) {
    return this.getTimeBlock(id).messageElement.text();
  }

  getMessageText(id) {
    return this.getTimeBlock(id).message;
  }

  findId(eventTarget) {
    return jQuery(eventTarget)
      .closest('[data-block-id]')
      .attr('data-block-id');
  }
}

const timeBlocks = new TimeBlocks('#time-blocks');

jQuery(function($) {
  // Displaying current date at top of the page.
  $('#currentDay').text(moment().format('dddd, MMMM Do'));
  for(let i = 0; i < 9; i++) {
    let momentObj = moment();
    momentObj.hours(i+9);
    timeBlocks.timeBlock(momentObj);
  }

  timeBlocks
    .container
    .on('focus', '[contenteditable]', onFocusEvent)
    .on('blur', '[contenteditable]',onBlurEvent)
    .on('click', 'button', onClickSaveEvent)

  $('.modal').on('click', 'button', onModalConfirmEvent)
});

/**
 * The modal has the id in question stored to the revert and save button.
 * If save-changes is clicked then TimeBlock object is saved.
 * Else the revert-changes is clicked and the TimeBlock object restores the saved text to the element.
 * @param {Event} event
 */
function onModalConfirmEvent(event) {
  let self = $(event.target);
  let id = timeBlocks.findId(self);

  if(self.attr('id') === 'save-changes') {
    timeBlocks.save(id);
  } else {
    timeBlocks.revert(id);
  }
}

/**
 * Ensures that the current text is different from the currently saved timeBlock.
 * Then prompts the user if they want to save.
 * @param {Event} event
 */
function onClickSaveEvent(event) {
  let id = timeBlocks.findId(event.target);
  let modal = $('.modal');

  if(!timeBlocks.isEditing(id)) return;

  modal
    .find('#modal-body')
    .text(`Save Event ${timeBlocks.getElementText(id)}`);

  modal
    .find('button')
    .attr('data-block-id', id);

  modal.modal({keyboard:false, backdrop: 'static', show: true})
}

/**
 * This toggles the isEditing property in TimeBlock object.
 * @param {Event} event
 */
function onFocusEvent(event) {
  let id = timeBlocks.findId(event.target);

  timeBlocks.editing(id);
}

/**
 * This checks if any edits have been made.  If they have then it toggles the isUnsaved property
 * in the TimeBlock Object.
 * @param {Event} event
 */
function onBlurEvent(event) {
  let self = $(event.target);
  let id = timeBlocks.findId(self);

  if(self.text() === timeBlocks.getMessageText(id)) {
    timeBlocks.revert(id);
  } else {
    timeBlocks.isDone(id);
  }
}
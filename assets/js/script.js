/**
 * This class controls the elements of the time block, including managing the state and data.
 * @property {moment} moment A moment object specifically for this TimeBlock.
 * @property {jQuery} container A jQuery object with a reference to the TimeBlock.
 * @property {string} messageStr The string that is displayed as the event name.
 * @property {boolean} isEditing Defines if the TimeBlock is being edited to ensure the new content is not overwritten.
 * @property {boolean} isUnsaved Defines if the TimeBlock has unsaved work.
 */
class TimeBlock {
  /**
   * Creates the contents of the time block by passing the HTML directly into jQuery.
   * @param {moment} momentObj
   */
  constructor(momentObj) {
    this.moment = momentObj === undefined ? moment() : momentObj;
    this.container = jQuery(`<section class="row time-block" data-block-id="${this.id}">
    <article class="hour col-2 col-lg-1"></article>
    <article class="col-8 col-lg-10 past pt-1" contenteditable="true"></article> 
    <button class="saveBtn col-2 col-lg-1"><i class="fa fa-save"></i></button>
</section>`)
    this.messageStr = '';
    this.isEditing = false;
    this.isUnsaved = false;
    this.updateDisplay();
  }

  /**
   * Returns the hour element as a jQuery object.  This is where the hour will be displayed.
   * @returns {jQuery}
   */
  get hourElement() {
    return this.container.find('.hour');
  }

  /**
   * Returns the message element as a jQuery object.  This is where the event name is displayed.
   * @returns {jQuery}
   */
  get messageElement() {
    return this.container.find('[contenteditable]');
  }

  /**
   * The container to append the TimeBlock to.
   * @param {string|jQuery|HTMLElement} container If a string is passed it is expected to be a CSS Selector.
   */
  appendTo(container) {
    // Using jQuery here to allow selectors, elements, and jQuery objects.
    jQuery(container).append(this.container);
  }

  /**
   * Get the message string that is currently saved.  This may or may not be the innerText that is rendered.
   * @returns {string}
   */
  get message() {
    return this.messageStr;
  }

  /**
   * Sets the message string that should be saved.  This may or may not be the innerText that is rendered.
   * @param {string} str
   */
  set message(str) {
    this.messageStr = str;
  }

  /**
   * The id for ease and readability purposes is the hour it represents.  This returns the current ID.
   * @returns {string}
   */
  get id() {
    return this.moment.format('hhA');
  }

  /**
   * Returns if we are currently past the hour this time block represents.
   * @returns {boolean}
   */
  get isPast() {
    return this.moment.hours() < moment().hours();
  }

  /**
   * Returns if we are currently before the hour this time block represents.
   * @returns {boolean}
   */
  get isFuture() {
    return this.moment.hours() > moment().hours();
  }

  /**
   * This method updates the HTML to reflect properly.
   */
  updateDisplay() {
    // Updating the ID.
    this.container.attr('data-block-id', this.id);

    // Updating the hour text.
    this.hourElement.text(this.id);

    // If isEditing is false then render message string.
    if(!this.isEditing) this.messageElement.text(this.messageStr);

    // If isUnsaved is false then remove class for bold font and if it is true add it.
    if(!this.isUnsaved) this.messageElement.removeClass('font-weight-bold');
    else this.messageElement.addClass('font-weight-bold');

    // Setting color classes based on if it is past the event hour or not.
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

  /**
   * Creates a representation of the TimeBlock using a literal object.
   * @returns {{date: string, message: string}}
   */
  toObject() {
    return {
      date: this.moment.format('x'),
      message: this.messageStr
    }
  }

  /**
   * Utilizes JSON.stringify combined with toObject method.
   * @returns {string}
   */
  toString() {
    return JSON.stringify(this.toObject());
  }

  /**
   * Defines if the TimeBlock is being edited right now.
   * @param {boolean} isEditing
   */
  editing(isEditing) {
    this.isEditing = isEditing;
  }

  /**
   * Defines if the TimeBlock has an unsaved message or not.
   * @param {boolean} isUnsaved
   */
  unsaved(isUnsaved) {
    this.isUnsaved = isUnsaved;
  }

  /**
   * Updates the message string to match what is being displayed currently.
   */
  save() {
    this.message = this.messageElement.text();
    this.isEditing = false;
    this.isUnsaved = false;
    this.updateDisplay();
  }

  /**
   * Takes what is currently saved to the message string and renders it to the page.
   */
  revert() {
    this.isEditing = false;
    this.isUnsaved = false;
    this.updateDisplay();
  }
}

/**
 * This class handles the main interaction of the TimeBlock objects as well as saves and loads to the localStorage.
 * @property {jQuery} container A jQuery object for the Time Block container.
 * @property {{string: TimeBlock}} timeBlocks The container for TimeBlock objects.
 * @property {number} interval So that the if we needed down the road we can easily cancel the interval that is set.
 */
class TimeBlocks {
  constructor(container) {
    this.container = jQuery(container);
    this.timeBlocks = {};
    this.interval = setInterval(this.updateDisplay.bind(this), 1000);
  }

  /**
   * Returns an Array with TimeBlock.toObjects.
   * @returns {[{date: string, message: string}]}
   */
  toObject() {
    let timeBlocks = [];
    for(let k in this.timeBlocks) {
      timeBlocks.push(this.timeBlocks[k].toObject());
    }

    return timeBlocks;
  }

  /**
   * Returns a JSON.stringify toObject method.
   * @returns {string}
   */
  toString() {
    return JSON.stringify(this.toObject());
  }

  /**
   * This method iterates through the TimeBlocks and instructs them to updateDisplay.
   */
  updateDisplay() {
    for(let k in this.timeBlocks) {
      this.timeBlocks[k].updateDisplay();
    }
  }

  /**
   * A TimeBlock factory.
   * @param {moment} momentObj
   */
  timeBlock(momentObj) {
    let timeBlock = new TimeBlock(momentObj);
    timeBlock.appendTo(this.container);
    this.timeBlocks[timeBlock.id] = timeBlock;
  }

  /**
   * Returns a TimeBlock objects by the ID.
   * @param {string} id
   * @returns {TimeBlock}
   */
  getTimeBlock(id) {
    return this.timeBlocks[id];
  }

  /**
   * Accepts a TimeBlock ID then sets isEditing to true.
   * @param {string} id
   */
  editing(id) {
    this.getTimeBlock(id).editing(true);
  }

  /**
   * Returns a TimeBlock.isEditing property by TimeBlock ID.
   * @param {string} id
   * @returns {boolean}
   */
  isEditing(id) {
    return this.getTimeBlock(id).isEditing;
  }

  /**
   * Looks up a TimeBlock then sets isUnsaved to true.
   * @param {string} id
   */
  isDone(id) {
    this.getTimeBlock(id).unsaved(true)
  }

  /**
   * Looks up a TimeBlock by ID then instructs the TimeBlock to save the currently displaying content.
   * @param {string} id
   */
  save(id) {
    this.getTimeBlock(id).save();
  }

  /**
   * Looks up a TimeBlock then instructs it to revert all content to its saved content.
   * @param {string} id
   */
  revert(id) {
    this.getTimeBlock(id).revert();
  }

  /**
   * Looks up a TimeBlock and returns the currently displayed message string.
   * @param {string} id
   * @returns {string}
   */
  getElementText(id) {
    return this.getTimeBlock(id).messageElement.text();
  }

  /**
   * Looks up a TimeBlock by the ID then returns the currently saved message string.
   * This may or may not be what is currently displayed.
   * @param {string} id
   * @returns {string}
   */
  getMessageText(id) {
    return this.getTimeBlock(id).message;
  }

  /**
   * Takes a child element either jQuery or HTMLElement and finds the container that has the TimeBlock ID
   * It then returns the TimeBlock ID.
   * @param {HTMLElement|jQuery} eventTarget
   * @returns {string}
   */
  findId(eventTarget) {
    return jQuery(eventTarget)
      .closest('[data-block-id]')
      .attr('data-block-id');
  }

  /**
   * Iterates through all TimeBlocks and saves them to localStorage as a JSON.stringify.  See toString method.
   */
  saveToLocalStorage() {
    localStorage.setItem('time-blocks', `${this}`);
  }

  /**
   * Loads the saved data from localStorage and iterates through it loading events that are validate for today.
   */
  loadFromLocalStorage() {
    let blocks = localStorage.getItem('time-blocks');
    if(blocks === null) blocks = [];
    else blocks = JSON.parse(blocks);
    for(let block of blocks) {
      if(block.message !== '') {
        let momentObj = moment(parseInt(block.date));
        if(momentObj.date() === moment().date()) {
          this.timeBlocks[momentObj.format('hhA')].message = block.message;
        }
      }
    }

    this.updateDisplay();
  }
}

// Globally declaring TimeBlocks class.
const timeBlocks = new TimeBlocks('#time-blocks');

jQuery(function($) {
  // Displaying current date at top of the page.
  $('#currentDay').text(moment().format('dddd, MMMM Do'));

  // Setting TimeBlock objects to the TimeBlocks Object for times 9AM-5PM
  for(let i = 0; i < 9; i++) {
    let momentObj = moment();
    momentObj.hours(i+9);
    timeBlocks.timeBlock(momentObj);
  }

  // Setting focus, blur. and click events.
  timeBlocks
    .container
    .on('focus', '[contenteditable]', onFocusEvent)
    .on('blur', '[contenteditable]',onBlurEvent)
    .on('click', 'button', onClickSaveEvent)

  // Setting modal events.
  $('.modal').on('click', 'button', onModalConfirmEvent)

  // Loading data from the localStorage.
  timeBlocks.loadFromLocalStorage();
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
    timeBlocks.saveToLocalStorage();
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
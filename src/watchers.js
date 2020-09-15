import { FORM_STATES } from './constants';

const invalidFieldClassName = 'is-invalid';

const renderForm = (state) => {
  const { state: formState, errorMessage } = state.form;
  const errorMessageNode = document.getElementById('errorMessage');
  const input = document.getElementById('rssLinkInput');

  if (formState === FORM_STATES.ERROR) {
    errorMessageNode.textContent = errorMessage;
    input.classList.add(invalidFieldClassName);
  }
  if (formState === FORM_STATES.PROCESSED) {
    errorMessageNode.textContent = '';
    input.classList.remove(invalidFieldClassName);
    input.value = '';
  }
};

const mapping = {
  'form': (state) => renderForm(state),
};

const watch = function (path, value, previousValue, name) {
  mapping[path](this);
};

export default watch;

import FORM_STATES from './constants';
import compose from 'lodash/fp/compose';
import forEach from 'lodash/forEach';
import groupBy from 'lodash/groupBy';
import differenceBy from 'lodash/differenceBy';

const invalidFieldClassName = 'is-invalid';

const getFeedId = (id) => `feedId-${id}`;

const renderForm = (state) => {
  const { state: formState, errorMessage } = state.form;
  const errorMessageNode = document.getElementById('errorMessage'); // eslint-disable-line
  const input = document.getElementById('rssLinkInput'); // eslint-disable-line

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

const createFeedNode = (feed) => {
  const { id, title } = feed;
  
  const feedNode = document.createElement('div');
  feedNode.setAttribute('id', getFeedId(id));
  
  const titleNode = document.createElement('h4');
  titleNode.append(title);

  const postsBoxNode = document.createElement('div');
  
  feedNode.appendChild(titleNode);
  feedNode.appendChild(postsBoxNode);
  
  return feedNode;
};

const renderFeeds = (state, newFeeds, prevFeeds) => {
  const addedFeeds = differenceBy(newFeeds, prevFeeds, 'id');
  const feedsBoxNode = document.getElementById('feedsBox');
  
  const renderFeed = compose(
    (feed) => feedsBoxNode.appendChild(feed),
    createFeedNode,
  );
  forEach(addedFeeds, renderFeed);
};

const createPostNode = (post) => {
  const { title, link } = post;

  const postNodeBox = document.createElement('div');
  const postNodeLink = document.createElement('a');
  postNodeLink.setAttribute('href', link);
  postNodeLink.append(title);

  postNodeBox.appendChild(postNodeLink);

  return postNodeBox;
};

const renderPosts = (state, newPosts, prevPosts) => {
  const addedPosts = differenceBy(newPosts, prevPosts, 'id');
  const groupedPostsByFeedId = groupBy(addedPosts, 'feedId');

  const renderFeedPosts = (feedPosts, feedId) => {
    const postsBoxNode = document.querySelector(`div[id=${getFeedId(feedId)}] > div`);
    postsBoxNode.innerHTML = '';
    const renderPost = compose(
      (post) => postsBoxNode.appendChild(post),
      createPostNode,
    );
    
    forEach(feedPosts, renderPost);
  };

  forEach(groupedPostsByFeedId, renderFeedPosts);
};

const mapping = {
  form: renderForm,
  feeds: renderFeeds,
  posts: renderPosts,
};

function watch(path, newValue, prevValue) {
  mapping[path](this, newValue, prevValue);
}

export default watch;

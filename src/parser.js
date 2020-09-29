import get from 'lodash/fp/get';
import compose from 'lodash/fp/compose';
import map from 'lodash/map';
import zipObject from 'lodash/zipObject';

const parseNode = (node) => {
  const nodeTags = ['title', 'description', 'link'];

  const getTagContent = compose(
    get('textContent'),
    (attr) => node.querySelector(attr),
  );

  const tagsContent = map(nodeTags, getTagContent);

  const parsedNode = zipObject(
    nodeTags,
    tagsContent,
  );

  return { ...parsedNode };
};

const parseFeed = (text) => {
  // eslint-disable-next-line no-undef
  const doc = new DOMParser().parseFromString(text, 'text/xml');

  const channelNode = doc.querySelector('channel');
  const postNodes = doc.querySelectorAll('item');

  const feed = parseNode(channelNode);
  const posts = map(postNodes, parseNode);

  return { feed, posts };
};

export default parseFeed;

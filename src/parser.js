import get from 'lodash/fp/get';
import compose from 'lodash/fp/compose';
import map from 'lodash/map';
import uniqueId from 'lodash/uniqueId';
import zipObject from 'lodash/zipObject';

const parseNode = (node) => {
  const nodeAttributes = ['title', 'description', 'link'];

  const getAttributeText = compose(
    get('textContent'),
    (attr) => node.querySelector(attr),
  );

  const parsedNode = zipObject(
    nodeAttributes,
    map(nodeAttributes, getAttributeText),
  );

  return { id: uniqueId(), ...parsedNode };
};

const addFeedId = (feedId) => (post) => ({ ...post, feedId });

const parseFeed = (xmlString) => {
  // eslint-disable-next-line no-undef
  const doc = new DOMParser().parseFromString(xmlString, 'text/xml');

  const channelNode = doc.querySelector('channel');
  const postNodes = doc.querySelectorAll('item');

  const feed = parseNode(channelNode);
  const posts = map(postNodes, compose(addFeedId(feed.id), parseNode));

  return { feed, posts };
};

export default parseFeed;

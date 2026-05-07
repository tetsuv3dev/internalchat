function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function validateNickname(nickname) {
  if (!nickname || typeof nickname !== 'string') {
    return 'Nickname is required';
  }
  if (nickname.length < 2 || nickname.length > 30) {
    return 'Nickname must be between 2 and 30 characters';
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(nickname)) {
    return 'Nickname can only contain letters, numbers, underscores, and hyphens';
  }
  return null;
}

function validateChannelName(name) {
  if (!name || typeof name !== 'string') {
    return 'Channel name is required';
  }
  if (name.length < 2 || name.length > 50) {
    return 'Channel name must be between 2 and 50 characters';
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return 'Channel name can only contain letters, numbers, underscores, and hyphens';
  }
  return null;
}

function validateMessage(content) {
  if (!content || typeof content !== 'string') {
    return 'Message content is required';
  }
  if (content.length > 10000) {
    return 'Message too long (max 10000 characters)';
  }
  return null;
}

module.exports = { sanitizeInput, validateNickname, validateChannelName, validateMessage };

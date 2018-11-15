//                                           _
//   ___ ___  _ __ ___  _ __ ___   ___ _ __ | |_
//  / __/ _ \| '_ ` _ \| '_ ` _ \ / _ \ '_ \| __|
// | (_| (_) | | | | | | | | | | |  __/ | | | |_
//  \___\___/|_| |_| |_|_| |_| |_|\___|_| |_|\__|
//

const mongoose = require('mongoose');
const Schema = mongoose.Schema;/**
* @description The Comment schema
* user and parent_post are just the ids
*/
const commentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 300 },
  parent_post: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
  is_deleted: Boolean
}, { timestamps: true }); // adds `createdAt` and `updatedAt`

// create model using schema:
const Comment = mongoose.model('Comment', commentSchema);

/////////////////////
//	Query Help
/////////////////////

// get all comments where parent_post is postID, not deleted:
function fromPostID(postID) {
  return Comment.find()
    .where('parent_post', postID)
    .ne('is_deleted', true)
    .sort('createdAt')
    .limit(300);
}

/////////////////////
//	Exports
/////////////////////

module.exports = Comment;
module.exports.fromPostID = fromPostID;

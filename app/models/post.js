//                  _
//  _ __   ___  ___| |_
// | '_ \ / _ \/ __| __|
// | |_) | (_) \__ \ |_
// | .__/ \___/|___/\__|
// |_|
//

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
* @description The Post data schema
* user is the id
*/
const postSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 400 },
    comment_count: { type: Number, default: 0, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true},
    point: {
        type: [Number], // [<longitude>, <latitude>]
        index: '2dsphere'
    },
    is_deleted: Boolean
}, { timestamps: true }); // adds `createdAt` and `updatedAt`

/**
* @description Easy setter for lat-long minded folks (b/c Mongo does it in reverse).
* Mongo does geo indexing by long,lat which is really some international standard
*/
postSchema.pre('save', function(next) {
    this.point = [this.longitude, this.latitude];
    next();
});

/////////////////////
//	Exports
/////////////////////

const Post = mongoose.model('Post', postSchema);
module.exports = Post;

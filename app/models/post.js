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
  longitude: { type: Number, required: true },
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number] // [<longitude>, <latitude>]
    }
  },
  is_deleted: Boolean
}, { timestamps: true }); // adds `createdAt` and `updatedAt`

postSchema.index({ location: '2dsphere' });
// so we will still have to do an in memory sort when we sort -createdAt,
// but it's limited to 200 so not a big deal but could look into doing a compound index if possible??

/**
* @description Easy setter for lat-long minded folks (b/c Mongo does it in reverse).
* Mongo does geo indexing by long,lat which is really some international standard.
* MongoDB validates geoJSON fields and yells about empty arrays.
* This ensures the doc gets 'fixed' properly before saving.
*/
postSchema.pre('save', function (next) {
  this.location = {
    type: 'Point',
    coordinates: [this.longitude, this.latitude]
  };
  next();
});

/////////////////////
//	Exports
/////////////////////

const Post = mongoose.model('Post', postSchema);
module.exports = Post;

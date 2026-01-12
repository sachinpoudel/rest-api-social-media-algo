import { GetPersonalizedFeedInput } from "../interfaces/User";
import { BadRequest } from "../middlewares/error/app-error";
import { Post } from "../models/Post-model";
import User from "../models/user-model";
import { Types } from "mongoose";

export const getPersonalizedFeedService = async (
  input: GetPersonalizedFeedInput
) => {
  const { userId, page = 1, limit = 10 } = input;

  if (page < 1 || limit < 1 || limit > 50) {
    throw new BadRequest("Invalid pagination parameters");
  }

  // find theuser the feed you want to show
  // get the friends of the user
  // get posts from friends and sort them by createdAt desc
  // paginate the results

  const user = await User.findById(userId).select(
    "friends following interactedWith blocked"
  );

  if (!user) {
    throw new BadRequest("User not found");
  }

  const friendsAndFollowingIds = [
    ...new Set([
      ...(user.friends || []).map((id) => id.toString()),
      ...(user.following || []).map((id) => id.toString()),
    ]),
  ];
  const interactedUserIds =
    user.interactWith
      ?.sort((a: any, b: any) => b.score - a.score)
      .slice(0, 10)
      .map((interaction: any) => interaction.user.toString()) || [];

  const blockedIds = (user.blocked || []).map((id) => id.toString());

  const skip = (page - 1) * limit;

  const feedPipeline: any[] = [
    {
      $match: {
        author: {
          $nin: [
            new Types.ObjectId(userId),
            ...user.blocked.map((id) => new Types.ObjectId(id)),
          ], // this will exclude posts from blocked users and the user himself
        },
      },
    },
    {
      $addFields: {
        authorStr: { $toString: "$author" },
        priorityScore: {
          $cond: [
            { $in: ["$authorStr", friendsAndFollowingIds] },
            {
              $cond: [{ $in: ["$authorStr", interactedUserIds] }, 2, 1],
            },
          ],
        },
        engagementScore: {
          $add: [
            { $size: { $ifNull: ["$likes", []] } },
            { $multiply: [{ $size: { $ifNull: ["$comments", []] } }, 2] },
          ],
        },
        recencyScore: {
          $divide: [
            { $subtract: [new Date(), "$createdAt"] },
            1000 * 60 * 60 * 24,
          ],
        },
      },
    },

    {
      addFields: {
        feedScore: {
          $add: [
            { $multiply: ["$priorityScore", 1000] },
            { $multiply: ["$engagementScore", 10] },
            { multiply: [{ $subtract: [100, "$recencyScore"] }] },
          ],
        },
      },
    },
    {
      $sort: {
        feedScore: -1,
        createdAt: -1,
      },
    },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        posts: [
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "_id",
              as: "author",
            },
          },
          { $unwind: "$author" },
          {
            $project: {
              title: 1,
              description: 1,
              photoUrl: 1,
              category: 1,
              likes: 1,
              disLikes: 1,
              comments: 1,
              views: 1,
              shares: 1,
              createdAt: 1,
              updatedAt: 1,
              "author._id": 1,
              "author.firstName": 1,
              "author.lastName": 1,
              "author.profileUrl": 1,
              "author.bio": 1,
              feedScore: 1,
            },
          },
        ],
      },
    },
  ];

  const result = await Post.aggregate(feedPipeline);

  const totalDocs = result[0]?.metadata[0]?.total || 0;
  const posts = result[0]?.posts || [];

  const totalPages = Math.ceil(totalDocs / limit);

  return {
    posts,
    totalDocs,
    totalPages,
    currentPage: page,
    nextPage: page < totalPages ? page + 1 : undefined,
    prevPage: page > 1 ? page - 1 : undefined,
    hasMore: page < totalPages,
  };

};
export const updateUserInteractionScore = async (
    userId: string,
    targetUserId: string,
    interactionType: "like" | "comment" | "view" = "like"
) : Promise<void> => {
    if(userId === targetUserId) return; // No need to update interaction score for self

const scoreIncrement = {
    like: 5, // like gives 5 points
    comment: 10,
    view:1,
}[interactionType] || 0;

await User.findOneAndUpdate(
  {
    _id: userId,
    "interactedWith.user": targetUserId,
  },
  {
    $inc: { "interactedWith.$.score": scoreIncrement },
    $set: { "interactedWith.$.lastInteractedAt": new Date() },
  }
)


const updated = await User.findOneAndUpdate(
  {
    _id: userId,
    "interactedWith.user": { $ne: targetUserId },
  },
  {
    $push: {
      interactedWith: {
        user: new Types.ObjectId(targetUserId),
        score: scoreIncrement,
        lastInteractedAt: new Date(),
      }
    }
  }
)

}
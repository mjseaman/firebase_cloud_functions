import * as functions from 'firebase-functions';

const admin = require('firebase-admin');
admin.initializeApp();

// Using just the Pixel 3 device token for now
// const tokens = ['eGYzLt3Uojo:APA91bFwyZd9NdYhyNYmxPCFnJn9McaI1y5kFz7VjIHp45-oMN8gvAur9cmg4EA3XEgcrLhi3TW49MkiU1cQWhTWLnFzpGmyPAt0lGymZ2ngWY9v4z6Keqqyr84_oBkfktSQg7T7sxt4'];

// // Create a notification
// const message = {
//   notification: {
//     title: 'Time to remember everything',
//     body: "If you review just one thing every day, your memory will markedly improve.",
//   },
//   topic: "dailyNotification"
// };

// // Schedules the job
// exports.dailyPracticeNotification = functions.pubsub.schedule('0 19 * * *')
//   .timeZone('America/Denver')
//   .onRun(async (context) => {
//     // console.log('Sending a notification every 2 minutes!');
//     admin.messaging().send(message)
//       .then((response: any) => {
//         // Response is a message ID string.
//         console.log('Successfully sent message:', response);
//       })
//       .catch((error: any) => {
//         console.log('Error sending message:', error);
//       });
//   });


exports.specialPracticeNotification = functions.pubsub.schedule('0 13 * * *')
  .timeZone('America/Denver')
  .onRun((context) => {
    // var customMessage = {
    //     'notification': {
    //         'title': 'test notification',
    //         'body': "If you review just one thing every day, your memory will markedly improve.",
    //     },
    // };
    // admin.messaging().sendToDevice(['dMtW-OrnKek:APA91bH6Coy7WnU0SLiokRU5UaHLelhi6AuOoTQ2eRQwwdGY8k5jsNO0UHSgQF0DfdaRCCIz_20vKAqXHSTVBcqhAab3mTsFwLQoKr78MzdC-JOQ3fg6_PqRqbHeFf2udUNjIxc_YQ0-'], customMessage)
    // .then((response: any) => {
    //     // Response is a message ID string.
    //     console.log('Successfully sent the message:', response);
    //     return null;
    // })
    //     .catch((error: any) => {
    //     console.log('Error sending message:', error);
    // });

    console.log('Starting to work');
    const db = admin.firestore();
    var teaserText: String = ``;
    var today = new Date();

    db.collection('users').get().then((usersSnapshot: any[]) => {
      console.log(`Got users: ${usersSnapshot}`);
      usersSnapshot.forEach(userDocument => {
        userDocument.ref.collection('messaging_tokens').get().then((tokensSnapshot: any[]) => {
          db.collection('memories').where('user_uid', '==', userDocument.data().uid).orderBy('next_practice').get()
            .then((memoriesSnapshot: any) => {
              if (memoriesSnapshot.empty) {
                console.log(`There were no memories in memoriesSnapshot.`);
                return null;
              }
              var memory = memoriesSnapshot.docs[0].data();

              if (memory.next_practice.toDate() > today) {
                return null;
              }

              if (memory.question.length > 0) {
                teaserText = memory.question;
              } else if (memory.quote_redacted.length > 0) {
                teaserText = memory.quote_redacted;
              } else {
                return null;
              }
              console.log(`First Memory data: ${teaserText}`);

              tokensSnapshot.forEach(tokenDocument => {
                const customMessage = {
                  'notification': {
                    'title': `Time to remember everything`,
                    'body': teaserText,
                  },
                  'data': {
                    'click_action': 'FLUTTER_NOTIFICATION_CLICK',
                    'sound': 'default', 
                    'status': 'done',
                    'screen': '/practice',
                  },
                };
                admin.messaging().sendToDevice([tokenDocument.data().token], customMessage)
                  .then((response: any) => {
                    // Response is a message ID string.
                    console.log('Successfully sent the message:', response);
                    return null;
                  })
                  .catch((error: any) => {
                    console.log('Error sending message:', error);
                  });
              });

              return null;
            })
            .catch((error: any) => {
              console.log('Error getting memories: ', error)
            });

          return null;
        })
          .catch((error: any) => {
            console.log('Error:', error);
          });
      });
    });
    return null;
  });


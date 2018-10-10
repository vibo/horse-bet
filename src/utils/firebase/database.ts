import { Firebase } from '.'
import { Bet } from 'models/bet'
import { Fixture } from 'models/fixture'
import { Placement } from 'models/placement'
import { User } from 'models/user'
import { Winner } from 'models/winner'

interface BetWithWinner extends Bet {
  winner: number
}

const mapBetPlacement = (bet: BetWithWinner) => ({
  id: bet.id,
  userId: bet.userId,
  fixtureId: bet.fixtureId,
  placement: bet.winner === 1 ? Placement.Home : Placement.Away
})

const getBets = async (firebase: Firebase) => {
  const bets = await firebase.db.collection('bets').get()
  return bets.docs.map(
    doc => ({ id: doc.id, ...doc.data(), placement: Placement.Placed } as Bet)
  )
}

const getBetPlacements = async (firebase: Firebase) => {
  const betPlacements = await firebase.db
    .collection('betPlacements')
    .where('date', '<=', new Date())
    .get()

  return betPlacements.docs.map(
    doc => ({ id: doc.id, ...doc.data() } as BetWithWinner)
  )
}

const getUserBetPlacements = async (firebase: Firebase, userId: string) => {
  const betPlacements = await firebase.db
    .collection('betPlacements')
    .where('userId', '==', userId)
    .get()

  return betPlacements.docs.map(
    doc => ({ id: doc.id, ...doc.data() } as BetWithWinner)
  )
}

export const shouldUpdateFixtures = async (firebase: Firebase) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const lastUpdateDate = await firebase.db
    .collection('fixtureUpdate')
    .where('date', '<', today)
    .get()

  console.log(lastUpdateDate, today)

  return lastUpdateDate.docs.length > 0
}

export const updateFixtureLastDate = async (firebase: Firebase) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return firebase.db
    .collection('fixtureUpdate')
    .doc('lastUpdate')
    .set(
      {
        date: today
      },
      { merge: true }
    )
}

export const getMe = async (firebase: Firebase, email: string) => {
  const user = await firebase.db
    .collection('users')
    .where('email', '==', email)
    .get()

  return user.docs.pop()
}

export const getUsers = async (userId: string, firebase: Firebase) => {
  const userCollection = await firebase.db.collection('users').get()
  const users = userCollection.docs.map(
    doc => ({ id: doc.id, ...doc.data() } as User)
  )
  const me = users.find(user => user.id === userId)
  const usersExceptMe = users.filter(user => user.id !== userId)

  if (me) {
    return [me, ...usersExceptMe]
  } else {
    return usersExceptMe
  }
}

export const getFixtures = async (firebase: Firebase) => {
  const fixtures = await firebase.db
    .collection('fixtures')
    .orderBy('date', 'desc')
    .get()

  return fixtures.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fixture))
}

export const getCombinedBets = async (firebase: Firebase, userId: string) => {
  const bets = await getBets(firebase)
  const betPlacements = await getBetPlacements(firebase)
  const userBetPlacements = await getUserBetPlacements(firebase, userId)

  const placements = betPlacements
    .map(mapBetPlacement)
    .filter(bet => bet.userId !== userId)
    .concat(userBetPlacements.map(mapBetPlacement))

  return bets.map(
    bet =>
      placements.find(
        betPlacement =>
          betPlacement.userId === bet.userId &&
          betPlacement.fixtureId === bet.fixtureId
      ) || bet
  )
}

export const saveBet = async (
  firebase: Firebase,
  fixture: Fixture,
  winner: Winner,
  existingBet: Bet | undefined
) => {
  if (existingBet) {
    await firebase.db
      .collection('betPlacements')
      .doc(existingBet.id)
      .set(
        {
          winner
        },
        { merge: true }
      )

    return existingBet.id
  }

  await firebase.db.collection('bets').add({
    userId: firebase.userId,
    fixtureId: fixture.id
  })

  const betPlacement = await firebase.db.collection('betPlacements').add({
    date: new Date(fixture.date),
    fixtureId: fixture.id,
    userId: firebase.userId,
    winner
  })

  return betPlacement.id
}

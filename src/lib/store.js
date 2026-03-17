// ── Minimal reactive store ──────────────────────────────────
const listeners = {}

export const store = {
  state: {
    pyramids:     [],
    members:      [],
    messages:     [],
    memberCounts: {},
    myPyramid:    null,
    myPyramidId:  null,
  },

  on(event, cb) {
    if (!listeners[event]) listeners[event] = []
    listeners[event].push(cb)
    return () => { listeners[event] = listeners[event].filter(l => l !== cb) }
  },

  // Clear all listeners — call before every screen change to avoid duplicates
  clearListeners() {
    Object.keys(listeners).forEach(k => { listeners[k] = [] })
  },

  emit(event, data) {
    listeners[event]?.forEach(cb => cb(data))
  },

  setAll({ pyramids, members, messages }) {
    this.state.pyramids = pyramids
    this.state.members  = members
    this.state.messages = messages
    this.rebuildCounts()
    this.emit('ready')
  },

  addPyramid(p) {
    if (!this.state.pyramids.find(x => x.id === p.id)) {
      this.state.pyramids.push(p)
      this.rebuildCounts()
      this.emit('pyramids:update')
    }
  },

  addMember(m) {
    if (!this.state.members.find(x => x.id === m.id)) {
      this.state.members.push(m)
      this.state.memberCounts[m.pyramid_id] = (this.state.memberCounts[m.pyramid_id] || 0) + 1
      this.emit('members:update', m)
      if (this.state.myPyramidId && m.pyramid_id === this.state.myPyramidId) {
        this.emit('my:newmember', m)
      }
    }
  },

  addMessage(msg) {
    if (!this.state.messages.find(x => x.id === msg.id)) {
      this.state.messages.push(msg)
      this.emit('messages:update', msg)
    }
  },

  setMyPyramid(p) {
    this.state.myPyramid   = p
    this.state.myPyramidId = p.id
    this.emit('my:pyramid', p)
  },

  rebuildCounts() {
    this.state.memberCounts = {}
    this.state.members.forEach(m => {
      this.state.memberCounts[m.pyramid_id] = (this.state.memberCounts[m.pyramid_id] || 0) + 1
    })
  },

  getSorted() {
    return [...this.state.pyramids].sort((a, b) =>
      (this.state.memberCounts[b.id] || 0) - (this.state.memberCounts[a.id] || 0)
    )
  },

  getMyMembers()  { return this.state.members.filter(m => m.pyramid_id === this.state.myPyramidId) },
  getMyMessages() { return this.state.messages.filter(m => m.pyramid_id === this.state.myPyramidId) },

  getMyRank() {
    const sorted = this.getSorted()
    return sorted.findIndex(p => p.id === this.state.myPyramidId) + 1
  },

  getLeader() {
    return this.getSorted()[0] || null
  },
}

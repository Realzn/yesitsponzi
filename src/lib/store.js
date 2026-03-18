// ── Global reactive store ────────────────────────────────────
const listeners = {}

export const store = {
  state: {
    pyramids:      [],
    members:       [],
    messages:      [],
    applications:  [],
    memberCounts:  {},
    myPyramid:     null,
    myPyramidId:   null,
    myMembership:  null,   // current member record with parent_id, depth etc
    myProfile:     null,
  },

  on(event, cb) {
    if (!listeners[event]) listeners[event] = []
    listeners[event].push(cb)
    return () => { listeners[event] = listeners[event].filter(l => l !== cb) }
  },

  clearListeners() { Object.keys(listeners).forEach(k => { listeners[k] = [] }) },

  emit(event, data) { listeners[event]?.forEach(cb => cb(data)) },

  setAll({ pyramids, members, messages }) {
    this.state.pyramids = pyramids
    this.state.members  = members
    this.state.messages = messages
    this.rebuildCounts()
    this.emit('ready')
  },

  addPyramid(p) {
    if (!this.state.pyramids.find(x => x.id === p.id)) {
      this.state.pyramids.push(p); this.rebuildCounts(); this.emit('pyramids:update')
    }
  },

  addMember(m, type = 'insert') {
    if (type === 'update') {
      const idx = this.state.members.findIndex(x => x.id === m.id)
      if (idx >= 0) this.state.members[idx] = m; else this.state.members.push(m)
    } else if (!this.state.members.find(x => x.id === m.id)) {
      this.state.members.push(m)
    }
    this.rebuildCounts()
    this.emit('members:update', m)
    if (this.state.myPyramidId && m.pyramid_id === this.state.myPyramidId) this.emit('my:newmember', m)
  },

  addMessage(msg) {
    if (!this.state.messages.find(x => x.id === msg.id)) {
      this.state.messages.push(msg); this.emit('messages:update', msg)
    }
  },

  addApplication(app, type = 'insert') {
    if (type === 'update') {
      const idx = this.state.applications.findIndex(x => x.id === app.id)
      if (idx >= 0) this.state.applications[idx] = app; else this.state.applications.push(app)
    } else if (!this.state.applications.find(x => x.id === app.id)) {
      this.state.applications.push(app)
    }
    this.emit('applications:update', app)
  },

  setMyPyramid(p)     { this.state.myPyramid = p; this.state.myPyramidId = p.id; this.emit('my:pyramid', p) },
  setMyProfile(p)     { this.state.myProfile = p; this.emit('my:profile', p) },
  setMyMembership(m)  { this.state.myMembership = m; this.emit('my:membership', m) },

  rebuildCounts() {
    this.state.memberCounts = {}
    this.state.members.filter(m => m.status === 'active').forEach(m => {
      this.state.memberCounts[m.pyramid_id] = (this.state.memberCounts[m.pyramid_id] || 0) + 1
    })
  },

  getSorted()       { return [...this.state.pyramids].sort((a, b) => (this.state.memberCounts[b.id] || 0) - (this.state.memberCounts[a.id] || 0)) },
  getMyMembers()    { return this.state.members.filter(m => m.pyramid_id === this.state.myPyramidId && m.status === 'active') },
  getMyMessages()   { return this.state.messages.filter(m => m.pyramid_id === this.state.myPyramidId) },
  getLeader()       { return this.getSorted()[0] || null },
  getMyRank()       { return this.getSorted().findIndex(p => p.id === this.state.myPyramidId) + 1 },

  getPendingApps()  {
    if (!this.state.myPyramidId) return []
    return this.state.applications.filter(a => a.target_pyramid === this.state.myPyramidId && a.status === 'pending')
  },
}

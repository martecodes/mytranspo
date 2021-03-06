module.exports = function (app, passport, db) {
  const fetch = require("node-fetch");
  const subwayRoutes = require("../subwayroutes.js")
  const railRoutes = require("../railroutes.js")
  const busRoutes = require("../busroutes.js")

  /*
    ======================================================================
    Routes
    ======================================================================
  */

  //Homepage =============================================================
  app.get("/", function (req, res) {
    res.render("index.ejs");
  });
  //======================================================================

  //Leaflet Fetch ========================================================
  app.get("/vehicles/:routeid", (req, res) => {
    fetch(`https://api-v3.mbta.com/vehicles?filter%5Broute%5D=${req.params.routeid}`, {
      headers: {
        "x-api-key": "6c7e8dcb17e44647ac1b58bdfd77e11a",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        res.send(data)
      });
  });

  app.get("/profileMap", (req, res) => {
    fetch(`https://api-v3.mbta.com/vehicles`, {
      headers: {
        "x-api-key": "6c7e8dcb17e44647ac1b58bdfd77e11a",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        res.send(data)
      });
  });

  app.get("/stopsLocation/:stopsId", (req, res) => {
    fetch(`https://api-v3.mbta.com/stops?filter%5Broute%5D=${req.params.stopsId}`, {
      headers: {
        "x-api-key": "6c7e8dcb17e44647ac1b58bdfd77e11a",
      }
    })
      .then(res => res.json())
      .then(data => {
        res.send(data)
      })
      .catch(err => {
        console.log(`error ${err}`)
      });
  })
  //======================================================================


  /*
    ======================================================================
    Profile render
    ======================================================================
  */
  app.get("/profile", isLoggedIn, async function (req, res) {
    const favorites = await db
      .collection("favorites")
      .find({ email: req.user.local.email })
      .toArray();
    res.render("profile.ejs", {
      user: req.user,
      favorites: favorites[0].routesName.sort()
    });
  });
  //======================================================================

  /*
    ======================================================================
    Render's page with leaflet and route user clicked
    ======================================================================
  */
  app.get("/route/:routeid", isLoggedIn, function (req, res) {
    db.collection("messages")
      .find()
      .toArray((err, result) => {
        if (err) return console.log(err);
        res.render("route.ejs", {
          user: req.user,
          routeid: req.params.routeid,
        });
      });
  });
  /*
      ======================================================================
      weather fetch
      ======================================================================
    */
  app.get("/latlng", isLoggedIn, function (req, res) {
     res.send(req.user)
  });

  /*
    ======================================================================
    Render Subway, Commuter Rail, and Bus page
    ======================================================================
  */
  app.get("/subway", isLoggedIn, async function (req, res) {
    const favorites = await db
      .collection("favorites")
      .find({ email: req.user.local.email })
      .toArray();
    res.render("subway.ejs", {
      user: req.user,
      favorites: favorites[0].routesName,
      subwayroutes: subwayRoutes
    });
  });

  app.get("/commuterRail", isLoggedIn, async function (req, res) {
    const favorites = await db
      .collection("favorites")
      .find({ email: req.user.local.email })
      .toArray();
    res.render("commuterRail.ejs", {
      user: req.user,
      favorites: favorites[0].routesName,
      railroutes: railRoutes
    });
  });

  app.get("/bus", isLoggedIn, async function (req, res) {
    const favorites = await db
      .collection("favorites")
      .find({ email: req.user.local.email })
      .toArray();
    res.render("bus.ejs", {
      user: req.user,
      favorites: favorites[0].routesName,
      busroutes: busRoutes
    });
  });
  //======================================================================

  /*
    ======================================================================
    Like and unlike function
    ======================================================================
  */
  app.put('/routeLikes', (req, res) => {
    db.collection('favorites')
      .findOneAndUpdate({ email: req.user.local.email }, {
        $push: {
          routesName: req.body.routeName
        }
      }, {
        sort: { _id: -1 },
        upsert: true
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
  })

  app.put('/routeUnLikes', (req, res) => {
    db.collection('favorites')
      .findOneAndUpdate({ email: req.user.local.email }, {
        $pull: {
          routesName: req.body.routeName
        }
      }, {
        sort: { _id: -1 },
        upsert: true
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
  })

  // LOGOUT ==============================
  app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
  });

  // data ================================

  // =============================================================================
  // AUTHENTICATE (FIRST LOGIN) ==================================================
  // =============================================================================

  // LOGIN ===============================
  // show the login form
  app.get("/login", function (req, res) {
    res.render("login.ejs", { message: req.flash("loginMessage") });
  });

  // process the login form
  app.post(
    "/login",
    passport.authenticate("local-login", {
      successRedirect: "/profile", // redirect to the secure profile section
      failureRedirect: "/login", // redirect back to the signup page if there is an error
      failureFlash: true, // allow flash messages
    })
  );

  // SIGNUP =================================
  // show the signup form
  app.get("/signup", function (req, res) {
    res.render("signup.ejs", { message: req.flash("signupMessage") });
  });

  // process the signup form
  app.post(
    "/signup",
    passport.authenticate("local-signup", {
      successRedirect: "/profile", // redirect to the secure profile section
      failureRedirect: "/signup", // redirect back to the signup page if there is an error
      failureFlash: true, // allow flash messages
    })
  );

  // =============================================================================
  // UNLINK ACCOUNTS =============================================================
  // =============================================================================
  // used to unlink accounts. for social accounts, just remove the token
  // for local account, remove email and password
  // user account will stay active in case they want to reconnect in the future

  // local -----------------------------------
  app.get("/unlink/local", isLoggedIn, function (req, res) {
    var user = req.user;
    user.local.email = undefined;
    user.local.password = undefined;
    user.save(function (err) {
      res.redirect("/profile");
    });
  });
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();

  res.redirect("/");
}

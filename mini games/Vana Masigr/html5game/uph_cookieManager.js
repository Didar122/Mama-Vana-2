
var version = "1.0";

// Replaced document.cookie with localStorage so saves work on file:// protocol.
// Browsers block cookies for local HTML files but localStorage works fine.

function cookieSet(argument0, argument1, argument2)
{
	/*
	argument0 = c_name
	argument1 = value
	argument2 = exdays (ignored - localStorage has no expiry)
	*/
	try {
		localStorage.setItem(argument0, String(argument1));
		return 1;
	} catch(e) {
		return e;
	}
}

function cookieGet(argument0)
{
	try {
		var val = localStorage.getItem(argument0);
		if (val === null) return null;
		return val;
	} catch(e) {
		return e;
	}
}

function cookieExsists(argument0)
{
  try {
	  var val = localStorage.getItem(argument0);
	  if (val !== null && val !== "")
	  {
	  return 1;
	  }
	else 
	  {
	  return 0;
	  }
	} catch(e) {
	  return e;
	}
}
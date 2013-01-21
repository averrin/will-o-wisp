var path = new Path();
var move_path = new Path();
hero = new Path.Circle(new Point(100, 70), 10);
hero.fillColor = '#9922ee';
hero.strokeColor = '#aa33ff';
hero.strokeWidth = 4;
hero.big = true;
path.add(hero.position);
path.name = 'path';
move_path.name = 'move_path';
move_path.visible = true;
move_path.strokeCap = 'round'

paper.project.move_path = move_path;
paper.project.path = path

var back = new Layer([path]);
var fg = new Layer([hero]);
fg.activate();

var at = 0;

move_path.strokeColor = 'black';
path.strokeColor = 'lightblue';
move_path.strokeWidth = 2;

text = new PointText(view.center);
text.paragraphStyle.justification = 'center';
text.characterStyle.fontSize = 20;
text.fillColor = 'black';

function Waypoint(point) {
    this.point = point
    this.dot = new Path.Circle(point, 3);
    this.dot.fillColor = 'orange';
    this.area = new Path.Circle(point, 10);
    this.area.strokeColor = '#444';
    this.area.fillColor = '#fdfdfd';
    this.area.strokeWidth = 2;
    this.marker = new Group([this.area, this.dot]);
    this.marker.visible = false;

    waypoints.addWaypoint(this)
}

Waypoint.prototype = {
    delete: function(){
        this.marker.visible = false;
    }
}

paper.Waypoint = Waypoint

function WaypointList() {
    this.waypoints = []
}
WaypointList.prototype = {
    getWaypoint: function (point) {
        var w = _.find(this.waypoints, function (wp) {
            var v = wp.point - point
            return v.length < 10
        })
        if (w) {
            return w
        } else {
            return false
        }
        return false
    },
    getNextWaypoint: function (wp) {
        return this.waypoints[_.indexOf(this.waypoints, wp) + 1]
    },
    addWaypoint: function (waypoint) {
        this.waypoints.push(waypoint)
        this.waypoints = _.uniq(this.waypoints, true)
    },
    delWaypoint: function (wp) {
        wp.delete()
        delete this.waypoints[_.indexOf(this.waypoints, wp)]
    },
    clear: function(){
        var $this = this
        _.each(this.waypoints, function(e,i){
            $this.delWaypoint(e)
        })
    }
}
var waypoints = new WaypointList()
paper.waypoints = waypoints
paper.hero = hero

function onFrame(event) {
    if (hero.big) {
        hero.scale(0.95)
        if (hero.bounds.width <= 10) {
            hero.big = false;
        }
    } else {
        hero.scale(1.05)
        if (hero.bounds.width >= 20) {
            hero.big = true;
        }
    }
    if (move_path.segments.length > 1) {
        var vector = move_path.segments[at].point - hero.position;
        //console.log(vector.length > 0)
        if (vector.length > 1) {
            hero.position = move_path.segments[at].point;
            if (!Key.isDown('shift')) {
                temp_path.segments[0].point = hero.position
            }
        } else {
            if (move_path.segments.length > (at + 1)) {
                at += 1
                paper.at = at
                //console.log('step', at)
                tw = waypoints.getWaypoint(hero.position)
                if (tw) {
                    if (hero.waypoint) {
                        waypoints.delWaypoint(hero.waypoint)
                    }
                    hero.waypoint = tw
                }
            } else {
                //at = 0
            }
        }
    }

    move_path.selected = $('#sel').is(':checked');
    move_path.visible = $('#show_path').is(':checked');
}

function drawGhost(point, mods) {
    temp_path = new Path();
    temp_path.strokeColor = 'gray'
    temp_path.dashArray = [10, 4];
    temp_path.visible = $('#preview').is(':checked');

    if (mods.shift) {
        temp_path.addSegments(path.segments);
    } else {
        temp_path.add(hero.position)
    }
    temp_path.add(point)
    if ($('#smooth_path').is(':checked')) {
        temp_path.smooth();
    }
    temp_path.removeOn({
        drag: true,
        up: true
    });
}

function onMouseDown(event) {
    back.activate()
    t = new Waypoint(event.point)
    t.marker.visible = true;
    drawGhost(event.point, event.modifiers)

    n = new Path()
    n.addSegments(getRemainPath())
    n.strokeColor = 'red'
    n.strokeWidth = 4
    n.removeOn({
        up: true
    });

}

function onMouseDrag(event) {

    t.marker.position = event.point;
    drawGhost(event.point, event.modifiers)

}

hwp = new Waypoint(hero.position)
hero.waypoint = hwp
waypoints.addWaypoint(hwp)

function getRemainPath() {
    tp = [hero.position]
    return tp.concat(_.pluck(waypoints.waypoints.slice(waypoints.waypoints.indexOf(waypoints.getNextWaypoint(hero.waypoint)), waypoints.waypoints.length), 'point'))
}
paper.getRemainPath = getRemainPath

function addToPath(point, mods) {
    at = 0
    if (!mods.shift) {
        waypoints.clear()
        back.removeChildren()
        path.removeSegments();
        path.add(hero.position);
        //waypoints.waypoints = []
        back.activate()
        t = new Waypoint(point)
        t.marker.visible = true;
    }
    path.add(point);
    if (path.segments.length > 0) {
        if (mods.shift) {
            move_path.removeSegments()
            path.removeSegments()
            path.addSegments(getRemainPath())
            move_path.addSegments(path.segments);
            move_path.closed = true;
            if ($('#smooth_path').is(':checked')) {
                move_path.smooth();
            }
        } else {
            move_path.removeSegments()
            move_path.addSegments(path.segments);
        }
        move_path.flatten(3);
        move_path.closed = false;
        if (path.segments.length > 2) {
            var lp = move_path.getNearestLocation(path.lastSegment.point)
            s = lp.segment;
            move_path.removeSegments(s._index, move_path.segments.length)
        }

    }


}


function onMouseUp(event) {
    addToPath(event.point, event.modifiers)

}


function onKeyDown() {
    if (event.key == 'a') {
        back.removeChildren()
        move_path.removeSegments()
        path.removeSegments();
        addToPath(hero.position);
        at = 0
    }
}
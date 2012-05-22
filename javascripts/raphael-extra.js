Raphael.fn.arrow = function (x1, y1, x2, y2, size) {
    var angle = Math.atan2(x1-x2,y2-y1);
    angle = (angle / (2 * Math.PI)) * 360;
    var arrowPath = this.path("M" + x2 + " " + y2 + " L" + (x2  - size) + " " + (y2  - size) + " L" + (x2  - size)  + " " + (y2  + size) + " L" + x2 + " " + y2 ).attr("fill","black").rotate((90+angle),x2,y2);
    var linePath = this.path("M" + x1 + " " + y1 + " L" + x2 + " " + y2);
    return [linePath,arrowPath];
};

Raphael.fn.factor = function (x1, y1, x2, y2, size) {
    var angle = Math.atan2(x1-x2,y2-y1);
    angle = (angle / (2 * Math.PI)) * 360;
    var xmid;
    if (x1 > x2)
        xmid = (x1-x2)/2 + x2;
    else 
        xmid = (x2-x1)/2 + x1;
    var ymid;
    if (y1 > y2)
        ymid = (y1-y2)/2 + y2;
    else 
        ymid = (y2-y1)/2 + y1;
    var factorPath = this.rect(xmid, ymid, size, size)
                          .attr("fill", "black");
    var linePath = this.path("M" + x1 + " " + y1 + " L" + x2 + " " + y2);
    return [linePath, factorPath]; //,arrowPath];
};

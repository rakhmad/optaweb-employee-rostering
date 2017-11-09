package org.optaplanner.openshift.employeerostering.gwtui.client.calendar;

import elemental2.dom.CanvasRenderingContext2D;
import elemental2.dom.MouseEvent;

public abstract class AbstractDrawable implements Drawable {
    Drawable parent;
    
    abstract void doDraw(CanvasRenderingContext2D g);
    
    @Override
    public void draw(CanvasRenderingContext2D g) {
        g.save();
        double tx, ty;
        if (null != parent) {
            tx = parent.getLocalX();
            ty = parent.getLocalY();
        }
        else {
            tx = 0;
            ty = 0;
        }
        g.translate(tx, ty);
        doDraw(g);
        g.restore();
    }
    
    @Override
    public double getGlobalX() {
        if (null != parent) {
            return parent.getGlobalX() + getLocalX();
        }
        else {
            return getLocalX();
        }
    }
    
    @Override
    public double getGlobalY() {
        if (null != parent) {
            return parent.getGlobalY() + getLocalY();
        }
        else {
            return getLocalY();
        }
    }
    
    @Override
    public Drawable getParent() {
        return this.parent;
    }
    
    @Override
    public void setParent(Drawable parent) {
        this.parent = parent;
    }
    
    @Override
    public void onMouseMove(MouseEvent e, double x, double y) {}
    
    @Override
    public void onMouseDrag(MouseEvent e, double x, double y) {}
    
    @Override
    public void onMouseDown(MouseEvent e, double x, double y) {}
        
    @Override
    public void onMouseUp(MouseEvent e, double x, double y) {}
}
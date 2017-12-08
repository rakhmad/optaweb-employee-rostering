package org.optaplanner.openshift.employeerostering.gwtui.client.spot;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import com.google.gwt.user.client.ui.Button;
import com.google.gwt.user.client.ui.CheckBox;
import com.google.gwt.user.client.ui.HasHorizontalAlignment;
import com.google.gwt.user.client.ui.HorizontalPanel;
import com.google.gwt.user.client.ui.Label;
import com.google.gwt.user.client.ui.ListBox;
import com.google.gwt.user.client.ui.PopupPanel;
import com.google.gwt.user.client.ui.VerticalPanel;
import elemental2.dom.CanvasRenderingContext2D;
import elemental2.dom.MouseEvent;
import org.gwtbootstrap3.client.ui.html.Div;
import org.gwtbootstrap3.client.ui.html.Span;
import org.optaplanner.openshift.employeerostering.gwtui.client.calendar.AbstractDrawable;
import org.optaplanner.openshift.employeerostering.gwtui.client.calendar.TimeRowDrawable;
import org.optaplanner.openshift.employeerostering.gwtui.client.calendar.TwoDayView;
import org.optaplanner.openshift.employeerostering.gwtui.client.canvas.CanvasUtils;
import org.optaplanner.openshift.employeerostering.gwtui.client.canvas.ColorUtils;
import org.optaplanner.openshift.employeerostering.gwtui.client.common.CommonUtils;
import org.optaplanner.openshift.employeerostering.gwtui.client.common.FailureShownRestCallback;
import org.optaplanner.openshift.employeerostering.gwtui.client.css.CssParser;
import org.optaplanner.openshift.employeerostering.gwtui.client.popups.FormPopup;
import org.optaplanner.openshift.employeerostering.gwtui.client.resources.css.CssResources;
import org.optaplanner.openshift.employeerostering.shared.employee.Employee;
import org.optaplanner.openshift.employeerostering.shared.employee.EmployeeRestServiceBuilder;
import org.optaplanner.openshift.employeerostering.shared.shift.ShiftRestServiceBuilder;
import org.optaplanner.openshift.employeerostering.shared.shift.view.ShiftView;

public class SpotDrawable extends AbstractDrawable implements TimeRowDrawable<SpotId> {

    TwoDayView<SpotId, ?, ?> view;
    SpotData data;
    int index;
    boolean isMouseOver;

    public SpotDrawable(TwoDayView<SpotId, ?, ?> view, SpotData data, int index) {
        this.view = view;
        this.data = data;
        this.index = index;
        this.isMouseOver = false;
        //ErrorPopup.show(this.toString());
    }

    @Override
    public double getLocalX() {
        double start = getStartTime().toEpochSecond(ZoneOffset.UTC) / 60;
        return start * view.getWidthPerMinute();
    }

    @Override
    public double getLocalY() {
        Integer cursorIndex = view.getCursorIndex(getGroupId());
        return (null != cursorIndex && cursorIndex > index) ? index * view.getGroupHeight() : (index + 1) * view
                .getGroupHeight();
    }

    @Override
    public void doDrawAt(CanvasRenderingContext2D g, double x, double y) {
        String color = (isMouseOver) ? ColorUtils.brighten(getFillColor()) : getFillColor();
        CanvasUtils.setFillColor(g, color);

        double start = getStartTime().toEpochSecond(ZoneOffset.UTC) / 60;
        double end = getEndTime().toEpochSecond(ZoneOffset.UTC) / 60;
        double duration = end - start;

        CanvasUtils.drawCurvedRect(g, x, y, duration * view.getWidthPerMinute(), view.getGroupHeight());

        CanvasUtils.setFillColor(g, ColorUtils.getTextColor(color));

        String employee;
        if (null == data.getAssignedEmployee()) {
            employee = "Unassigned";
        } else {
            employee = data.getAssignedEmployee().getName();
        }

        String pad = (data.isLocked()) ? "BB" : "";

        int fontSize = CanvasUtils.fitTextToBox(g, employee + pad, duration * view.getWidthPerMinute() * 0.75, view
                .getGroupHeight() * 0.75);
        g.font = CanvasUtils.getFont(fontSize);
        double[] textSize = CanvasUtils.getPreferredBoxSizeForText(g, employee, 12);

        g.fillText(employee, x + (duration * view.getWidthPerMinute() - textSize[0]) * 0.5,
                y + (view.getGroupHeight() + textSize[1]) * 0.5);

        if (data.isLocked()) {
            CanvasUtils.drawGlyph(g, CanvasUtils.Glyphs.LOCK, fontSize, x +
                    (duration * view.getWidthPerMinute() + textSize[0]) * 0.5, y + (view.getGroupHeight() + textSize[1])
                            * 0.5);
        }
    }

    @Override
    public boolean onMouseMove(MouseEvent e, double x, double y) {
        view.preparePopup(this.toString());
        return true;
    }

    @Override
    public boolean onMouseEnter(MouseEvent e, double x, double y) {
        isMouseOver = true;
        return true;
    }

    @Override
    public boolean onMouseExit(MouseEvent e, double x, double y) {
        isMouseOver = false;
        return true;
    }

    @Override
    public PostMouseDownEvent onMouseDown(MouseEvent mouseEvent, double x, double y) {
        EmployeeRestServiceBuilder.getEmployeeList(data.getShift().getTenantId(), new FailureShownRestCallback<List<
                Employee>>() {

            @Override
            public void onSuccess(List<Employee> employeeList) {
                // TODO: i18n
                FormPopup popup = FormPopup.getFormPopup();

                VerticalPanel panel = new VerticalPanel();
                panel.setStyleName(FormPopup.getStyles().form());
                HorizontalPanel datafield = new HorizontalPanel();

                Label label = new Label("Is Locked");
                CheckBox checkbox = new CheckBox();
                checkbox.setValue(data.isLocked());
                datafield.add(label);
                datafield.add(checkbox);
                panel.add(datafield);

                datafield = new HorizontalPanel();
                label = new Label("Assigned Employee");
                ListBox assignedEmployeeListBox = new ListBox();
                employeeList.forEach((e) -> assignedEmployeeListBox.addItem(e.getName()));
                if (!data.isLocked()) {
                    assignedEmployeeListBox.setEnabled(false);
                } else {
                    assignedEmployeeListBox.setSelectedIndex(employeeList.indexOf(data.getAssignedEmployee()));
                }
                checkbox.addValueChangeHandler((v) -> assignedEmployeeListBox.setEnabled(v.getValue()));
                datafield.add(label);
                datafield.add(assignedEmployeeListBox);
                panel.add(datafield);

                datafield = new HorizontalPanel();
                Button confirm = new Button();

                confirm.setText("Confirm");
                confirm.setStyleName(FormPopup.getStyles().submit());
                confirm.addClickHandler((c) -> {
                    if (checkbox.getValue()) {
                        Employee employee = employeeList.stream().filter((e) -> e.getName().equals(
                                assignedEmployeeListBox.getSelectedValue())).findFirst().get();
                        data.getShift().setLockedByUser(true);
                        data.getShift().setEmployee(employee);
                        ShiftView shiftView = new ShiftView(data.getShift());
                        popup.hide();
                        ShiftRestServiceBuilder.updateShift(data.getShift().getTenantId(), shiftView,
                                new FailureShownRestCallback<Void>() {

                                    @Override
                                    public void onSuccess(Void result) {
                                        view.getCalendar().forceUpdate();
                                    }

                                });
                    } else {
                        data.getShift().setLockedByUser(false);
                        ShiftView shiftView = new ShiftView(data.getShift());
                        popup.hide();
                        ShiftRestServiceBuilder.updateShift(data.getShift().getTenantId(), shiftView,
                                new FailureShownRestCallback<Void>() {

                                    @Override
                                    public void onSuccess(Void result) {
                                        view.getCalendar().forceUpdate();
                                    }

                                });
                    }

                });

                Button cancel = new Button();
                // TODO: Replace with i18n later
                cancel.setText("Cancel");
                cancel.setStyleName(FormPopup.getStyles().cancel());
                cancel.addClickHandler((e) -> popup.hide());

                Div submitDiv = new Div();
                submitDiv.setStyleName(FormPopup.getStyles().submitDiv());

                datafield.setStyleName(FormPopup.getStyles().buttonGroup());
                datafield.add(cancel);
                datafield.add(confirm);

                submitDiv.add(datafield);
                panel.add(submitDiv);

                popup.setWidget(panel);
                popup.center();
            }
        });

        return PostMouseDownEvent.REMOVE_FOCUS;
    }

    @Override
    public int getIndex() {
        return index;
    }

    @Override
    public SpotId getGroupId() {
        return data.getGroupId();
    }

    @Override
    public LocalDateTime getStartTime() {
        return data.getStartTime();
    }

    @Override
    public LocalDateTime getEndTime() {
        return data.getEndTime();
    }

    @Override
    public void doDraw(CanvasRenderingContext2D g) {
        doDrawAt(g, getGlobalX(), getGlobalY());
    }

    public String toString() {
        StringBuilder out = new StringBuilder(data.getSpot().getName());
        out.append(' ');
        out.append(CommonUtils.pad(getStartTime().getHour() + "", 2));
        out.append(':');
        out.append(CommonUtils.pad(getStartTime().getMinute() + "", 2));
        out.append('-');
        out.append(CommonUtils.pad(getEndTime().getHour() + "", 2));
        out.append(':');
        out.append(CommonUtils.pad(getEndTime().getMinute() + "", 2));
        out.append(" -- ");
        String employee;
        if (null == data.getAssignedEmployee()) {
            employee = "no one";
        } else {
            employee = data.getAssignedEmployee().getName();
            if (data.isLocked()) {
                employee += " (locked)";
            }
        }
        out.append("Assigned to ");
        out.append(employee);
        return out.toString();
    }

    private String getFillColor() {
        return CssParser.getCssProperty(CssResources.INSTANCE.calendar(),
                CssResources.INSTANCE.calendar().spotShiftView(),
                "background-color");
    }

}
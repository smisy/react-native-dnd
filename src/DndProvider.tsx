import React, { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { LayoutRectangle, Share, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureEventPayload,
  GestureStateChangeEvent,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
  State,
} from "react-native-gesture-handler";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import {
  SharedValue,
  cancelAnimation,
  runOnJS,
  runOnUI,
  useAnimatedReaction,
  useSharedValue,
} from "react-native-reanimated";
import {
  DndContext,
  DraggableItemOptions,
  DraggableOptions,
  DraggableState,
  DraggableStates,
  DroppableOptions,
  ItemOptions,
  Layouts,
  Offsets,
} from "./DndContext";
import { SharedPoint, UseDraggableOptions, UseDroppableOptions, useSharedPoint } from "./hooks";
import { UniqueIdentifier } from "./types";
import {
  Point,
  Rectangle,
  animatePointWithSpring,
  applyOffset,
  getDistance,
  includesPoint,
  overlapsRectangle,
} from "./utils";
interface DndProviderProps {
  children: React.ReactNode;
  springConfig?: object;
  minDistance?: number;
  activationDelay?: number;
  disabled?: boolean;
  hapticFeedback?: string;
  onDragEnd?: (context: { active: DraggableItemOptions; over: ItemOptions | null }) => void;
  onBegin?: (
    event: GestureStateChangeEvent<PanGestureHandlerEventPayload>,
    context: { activeId: UniqueIdentifier; activeLayout: LayoutRectangle },
  ) => void;
  onUpdate?: (
    event: GestureUpdateEvent<PanGestureHandlerEventPayload>,
    context: { activeId: UniqueIdentifier; activeLayout: LayoutRectangle },
  ) => void;
  onFinalize?: (
    event: GestureStateChangeEvent<PanGestureHandlerEventPayload>,
    context: { activeId: UniqueIdentifier; activeLayout: LayoutRectangle },
  ) => void;
  style?: object;
  debug?: boolean;
  scrollableContentOffset?: { x: number; y: number };
}

export const DndProvider = forwardRef(function DndProvider(
  {
    children,
    springConfig = {},
    minDistance = 0,
    activationDelay = 0,
    disabled,
    hapticFeedback,
    onDragEnd,
    onBegin,
    onUpdate,
    onFinalize,
    style,
    debug,
    scrollableContentOffset,
  }: DndProviderProps,
  ref,
) {
  //   const containerRef = useRef(null);
  //   const draggableLayouts = useSharedValue<{ [key: string]: SharedValue<Rectangle> }>({});
  //   const droppableLayouts = useSharedValue<{ [key: string]: SharedValue<Rectangle> }>({});
  //   const draggableOptions = useSharedValue<{ [key: string]: DraggableItemOptions }>({});
  //   const droppableOptions = useSharedValue<{ [key: string]: ItemOptions }>({});
  //   const draggableOffsets = useSharedValue<{ [key: string]: SharedPoint }>({});
  //   const draggableRestingOffsets = useSharedValue<{ [key: string]: SharedPoint }>({});
  //   const draggableStates = useSharedValue<{ [key: string]: DraggableState }>({});
  //   const draggablePendingId = useSharedValue<string | null>(null);
  //   const draggableActiveId = useSharedValue<string | null>(null);
  //   const droppableActiveId = useSharedValue<string | null>(null);
  //   const draggableActiveLayout = useSharedValue<Rectangle | null>(null);
  //   const draggableInitialOffset = useSharedPoint(0, 0);
  //   const draggableContentOffset = useSharedPoint(0, 0);
  //   const panGestureState = useSharedValue(0);
  const containerRef = useRef(null);
  const draggableLayouts = useSharedValue<Layouts>({});
  const droppableLayouts = useSharedValue<Layouts>({});
  const draggableOptions = useSharedValue<DraggableOptions>({});
  const droppableOptions = useSharedValue<DroppableOptions>({});
  const draggableOffsets = useSharedValue<Offsets>({});
  const draggableRestingOffsets = useSharedValue<Offsets>({});
  const draggableStates = useSharedValue<DraggableStates>({});
  const draggablePendingId = useSharedValue<UniqueIdentifier | null>(null);
  const draggableActiveId = useSharedValue<UniqueIdentifier | null>(null);
  const droppableActiveId = useSharedValue<UniqueIdentifier | null>(null);
  const draggableActiveLayout = useSharedValue<LayoutRectangle | null>(null);
  const draggableInitialOffset = useSharedPoint(0, 0);
  const draggableContentOffset = useSharedPoint(0, 0);
  const panGestureState = useSharedValue<GestureEventPayload["state"]>(0);

  ///

  //   containerRef: RefObject<View>;
  //   draggableLayouts: SharedValue<Layouts>;
  //   droppableLayouts: SharedValue<Layouts>;
  //   draggableOptions: SharedValue<DraggableOptions>;
  //   droppableOptions: SharedValue<DroppableOptions>;
  //   draggableOffsets: SharedValue<Offsets>;
  //   draggableRestingOffsets: SharedValue<Offsets>;
  //   draggableStates: SharedValue<DraggableStates>;
  //   draggablePendingId: SharedValue<UniqueIdentifier | null>;
  //   draggableActiveId: SharedValue<UniqueIdentifier | null>;
  //   droppableActiveId: SharedValue<UniqueIdentifier | null>;
  //   draggableActiveLayout: SharedValue<LayoutRectangle | null>;
  //   draggableInitialOffset: SharedPoint;
  //   draggableContentOffset: SharedPoint;
  //   panGestureState: SharedValue<GestureEventPayload["state"]>;

  ////
  // console.log('insight scrollableContentOffset', scrollableContentOffset);
  const runFeedback = () => {
    if (hapticFeedback) {
      ReactNativeHapticFeedback.trigger(hapticFeedback);
    }
  };
  useAnimatedReaction(
    () => draggableActiveId.value,
    (next, prev) => {
      if (next !== prev) {
        // runOnJS(setActiveId)(next);
      }
      if (next !== null) {
        runOnJS(runFeedback)();
      }
    },
    [],
  );
  const contextValue = useRef({
    containerRef,
    draggableLayouts,
    droppableLayouts,
    draggableOptions,
    droppableOptions,
    draggableOffsets,
    draggableRestingOffsets,
    draggableStates,
    draggablePendingId,
    draggableActiveId,
    droppableActiveId,
    panGestureState,
    draggableInitialOffset,
    draggableActiveLayout,
    draggableContentOffset,
  });
  useImperativeHandle(
    ref,
    () => {
      return {
        draggableLayouts,
        draggableOffsets,
        draggableRestingOffsets,
        draggableActiveId,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const panGesture = useMemo(() => {
    const findActiveLayoutId = (point: Point<number>) => {
      "worklet";
      const { x, y } = point;
      const { value: layouts } = draggableLayouts;
      const { value: offsets } = draggableOffsets;
      const { value: options } = draggableOptions;
      for (const [id, layout] of Object.entries(layouts)) {
        // console.log({ [id]: floorLayout(layout.value) });
        const offset = offsets[id];
        const isDisabled = options[id].disabled;
        if (
          !isDisabled &&
          includesPoint(layout.value, {
            x: x - offset.x.value + draggableContentOffset.x.value,
            y: y - offset.y.value + draggableContentOffset.y.value,
          })
        ) {
          return id;
        }
      }
      return null;
    };
    const findDroppableLayoutId = (activeLayout: Rectangle) => {
      "worklet";
      const { value: layouts } = droppableLayouts;
      const { value: options } = droppableOptions;
      for (const [id, layout] of Object.entries(layouts)) {
        // console.log({ [id]: floorLayout(layout.value) });
        const isDisabled = options[id].disabled;
        if (!isDisabled && overlapsRectangle(activeLayout, layout.value)) {
          return id;
        }
      }
      return null;
    };
    // Helpers for delayed activation (eg. long press)
    let timeout: NodeJS.Timeout | null | undefined = null;
    const clearActiveIdTimeout = () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
    const setActiveId = (id: UniqueIdentifier, delay: number) => {
      timeout = setTimeout(() => {
        runOnUI(() => {
          "worklet";
          debug && console.log(`draggableActiveId.value = ${id}`);
          draggableActiveId.value = id;
          draggableStates.value[id].value = "dragging";
        })();
      }, delay);
    };
    const panGesture = Gesture.Pan()
      .onBegin((event) => {
        // Reset droppable
        const { state, x, y } = event;
        const tempX = x + (scrollableContentOffset?.x || 0);
        const tempY = y + (scrollableContentOffset?.y || 0);
        debug && console.log("begin", { state, x, y });
        // Gesture is globally disabled
        if (disabled) {
          return;
        }
        // console.log("begin", { state, x, y });
        // Track current state for cancellation purposes
        panGestureState.value = state;
        const { value: layouts } = draggableLayouts;
        const { value: offsets } = draggableOffsets;
        const { value: restingOffsets } = draggableRestingOffsets;
        const { value: options } = draggableOptions;
        const { value: states } = draggableStates;
        // for (const [id, offset] of Object.entries(offsets)) {
        //   console.log({ [id]: [offset.x.value, offset.y.value] });
        // }
        // Find the active layout key under {x, y}
        const activeId = findActiveLayoutId({ x: tempX, y: tempY });
        // const activeId = findActiveLayoutId({ x, y });
        console.log("activeId", activeId);
        // console.log('1draggableActiveId', activeId);
        // Check if an item was actually selected
        if (activeId !== null) {
          console.log("1draggableLayouts", draggableLayouts.value[activeId]);
          console.log("1draggableOffsets", draggableOffsets.value[activeId]);
          console.log("1draggableRestingOffsets", draggableRestingOffsets.value[activeId]);
          // Record any ongoing current offset as our initial offset for the gesture
          const activeLayout = layouts[activeId].value;
          const activeOffset = offsets[activeId];
          const restingOffset = restingOffsets[activeId];
          const { value: activeState } = states[activeId];
          draggableInitialOffset.x.value = activeOffset.x.value;
          draggableInitialOffset.y.value = activeOffset.y.value;
          // Cancel the ongoing animation if we just reactivated an acting/dragging item
          if (["dragging", "acting"].includes(activeState)) {
            cancelAnimation(activeOffset.x);
            cancelAnimation(activeOffset.y);
            // If not we should reset the resting offset to the current offset value
            // But only if the item is not currently still animating
          } else {
            // active or pending
            // Record current offset as our natural resting offset for the gesture
            restingOffset.x.value = activeOffset.x.value;
            restingOffset.y.value = activeOffset.y.value;
          }
          // Update activeId directly or with an optional delay
          const { activationDelay } = options[activeId];
          if ((activationDelay ?? 0) > 0) {
            draggablePendingId.value = activeId;
            draggableStates.value[activeId].value = "pending";
            runOnJS(setActiveId)(activeId, activationDelay);
            // @TODO activeLayout
          } else {
            draggableActiveId.value = activeId;
            draggableActiveLayout.value = applyOffset(activeLayout, {
              x: activeOffset.x.value,
              y: activeOffset.y.value,
            });
            draggableStates.value[activeId].value = "dragging";
          }
          if (onBegin) {
            onBegin(event, { activeId, activeLayout });
          }
        }
      })
      .onUpdate((event) => {
        // console.log(draggableStates.value);
        const { state, translationX, translationY } = event;
        debug && console.log("update", { state, translationX, translationY });
        // Track current state for cancellation purposes
        panGestureState.value = state;
        const { value: activeId } = draggableActiveId;
        const { value: pendingId } = draggablePendingId;
        const { value: options } = draggableOptions;
        const { value: layouts } = draggableLayouts;
        const { value: offsets } = draggableOffsets;
        // const { value: states } = draggableStates;
        if (activeId === null) {
          // Check if we are currently waiting for activation delay
          if (pendingId !== null) {
            const { activationTolerance } = options[pendingId];
            // Check if we've moved beyond the activation tolerance
            const distance = getDistance(translationX, translationY);
            if (distance > (activationTolerance ?? 0)) {
              runOnJS(clearActiveIdTimeout)();
              draggablePendingId.value = null;
            }
          }
          // Ignore item-free interactions
          return;
        }
        // Update our active offset to pan the active item
        const activeOffset = offsets[activeId];
        activeOffset.x.value = draggableInitialOffset.x.value + translationX;
        activeOffset.y.value = draggableInitialOffset.y.value + translationY;
        // Check potential droppable candidates
        const activeLayout = layouts[activeId].value;
        draggableActiveLayout.value = applyOffset(activeLayout, {
          x: activeOffset.x.value,
          y: activeOffset.y.value,
        });
        droppableActiveId.value = findDroppableLayoutId(draggableActiveLayout.value);
        if (onUpdate) {
          onUpdate(event, { activeId, activeLayout: draggableActiveLayout.value });
        }
      })
      .onFinalize((event) => {
        const { state, velocityX, velocityY } = event;
        debug && console.log("finalize", { state, velocityX, velocityY });
        // Track current state for cancellation purposes
        panGestureState.value = state; // can be `FAILED` or `ENDED`
        const { value: activeId } = draggableActiveId;
        const { value: pendingId } = draggablePendingId;
        const { value: layouts } = draggableLayouts;
        const { value: offsets } = draggableOffsets;
        const { value: restingOffsets } = draggableRestingOffsets;
        const { value: states } = draggableStates;
        // Ignore item-free interactions
        if (activeId === null) {
          // Check if we were currently waiting for activation delay
          if (pendingId !== null) {
            runOnJS(clearActiveIdTimeout)();
            draggablePendingId.value = null;
          }
          return;
        }
        // Reset interaction-related shared state for styling purposes
        draggableActiveId.value = null;
        if (onFinalize) {
          const activeLayout = layouts[activeId].value;
          const activeOffset = offsets[activeId];
          const updatedLayout = applyOffset(activeLayout, {
            x: activeOffset.x.value,
            y: activeOffset.y.value,
          });
          onFinalize(event, { activeId, activeLayout: updatedLayout });
        }
        // Callback
        if (state !== State.FAILED && onDragEnd) {
          const { value: dropActiveId } = droppableActiveId;

          if (dropActiveId !== null) {
            // console.log('over -- layout', droppableLayouts.value[dropActiveId].value.x, droppableLayouts.value[dropActiveId].value.y);

            // Move to active droppable position
            const activeOffset = offsets[activeId];
            // const restingOffset = restingOffsets[activeId];
            // console.log('active -- offset', activeOffset.x.value, activeOffset.y.value);
            // console.log('resting -- offset', restingOffset.x.value, restingOffset.y.value);
            // console.log('draggable active layout --',  draggableLayouts.value[activeId].value);
            states[activeId].value = "acting";
            // const [targetX, targetY] = [restingOffset.x.value, restingOffset.y.value];
            // const [targetX, targetY] = [droppableLayouts.value[dropActiveId].value.x - restingOffset.x.value, droppableLayouts.value[dropActiveId].value.y - restingOffset.y.value];
            // const [targetX, targetY] = [droppableLayouts.value[dropActiveId].value.x, droppableLayouts.value[dropActiveId].value.y];
            const [targetX, targetY] = [
              droppableLayouts.value[dropActiveId].value.x - draggableLayouts.value[activeId].value.x,
              droppableLayouts.value[dropActiveId].value.y - draggableLayouts.value[activeId].value.y,
            ];
            animatePointWithSpring(
              activeOffset,
              [targetX, targetY],
              [
                { ...springConfig, velocity: velocityX },
                { ...springConfig, velocity: velocityY },
              ],
              ([finishedX, finishedY]) => {
                // Cancel if we are interacting again with this item
                if (
                  panGestureState.value !== State.END &&
                  panGestureState.value !== State.FAILED &&
                  states[activeId].value !== "acting"
                ) {
                  return;
                }
                states[activeId].value = "resting";
                if (!finishedX || !finishedY) {
                  // console.log(`${activeId} did not finish to reach ${targetX.toFixed(2)} ${currentX}`);
                }
                // for (const [id, offset] of Object.entries(offsets)) {
                //   console.log({ [id]: [offset.x.value.toFixed(2), offset.y.value.toFixed(2)] });
                // }
              },
            );
            console.log("2draggableActiveId", activeId);
            console.log("2draggableLayouts", draggableLayouts.value[activeId]);
            console.log("2draggableOffsets", draggableOffsets.value[activeId]);
            console.log("2draggableRestingOffsets", draggableRestingOffsets.value[activeId]);
            // Reset droppable
            droppableActiveId.value = null;

            // // Update our active offset to pan the active item
            // const activeOffset = offsets[activeId];
            // activeOffset.x.value = draggableInitialOffset.x.value + translationX;
            // activeOffset.y.value = draggableInitialOffset.y.value + translationY;
            // // Check potential droppable candidates
            // const activeLayout = layouts[activeId].value;
            // draggableActiveLayout.value = applyOffset(activeLayout, {
            //     x: activeOffset.x.value,
            //     y: activeOffset.y.value,
            // });
          }
          onDragEnd({
            active: draggableOptions.value[activeId],
            over: dropActiveId !== null ? droppableOptions.value[dropActiveId] : null,
          });
        }
        // // Reset droppable
        // droppableActiveId.value = null;
        // // Move back to initial position
        // const activeOffset = offsets[activeId];
        // const restingOffset = restingOffsets[activeId];
        // states[activeId].value = "acting";
        // // const [targetX, targetY] = [restingOffset.x.value, restingOffset.y.value];
        // const [targetX, targetY] = [droppableLayouts.value[dropActiveId].value.x, droppableLayouts.value[dropActiveId].value.y];
        // animatePointWithSpring(activeOffset, [targetX, targetY], [
        //     { ...springConfig, velocity: velocityX },
        //     { ...springConfig, velocity: velocityY },
        // ], ([finishedX, finishedY]) => {
        //     // Cancel if we are interacting again with this item
        //     if (panGestureState.value !== State.END &&
        //         panGestureState.value !== State.FAILED &&
        //         states[activeId].value !== "acting") {
        //         return;
        //     }
        //     states[activeId].value = "resting";
        //     if (!finishedX || !finishedY) {
        //         // console.log(`${activeId} did not finish to reach ${targetX.toFixed(2)} ${currentX}`);
        //     }
        //     // for (const [id, offset] of Object.entries(offsets)) {
        //     //   console.log({ [id]: [offset.x.value.toFixed(2), offset.y.value.toFixed(2)] });
        //     // }
        // });
      })
      .withTestId("DndProvider.pan");
    // Duration in milliseconds of the LongPress gesture before Pan is allowed to activate.
    // If the finger is moved during that period, the gesture will fail.
    if (activationDelay > 0) {
      panGesture.activateAfterLongPress(activationDelay);
    }
    // Minimum distance the finger (or multiple finger) need to travel before the gesture activates. Expressed in points.
    if (minDistance > 0) {
      panGesture.minDistance(minDistance);
    }
    return panGesture;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, scrollableContentOffset]);
  return (
    <DndContext.Provider value={contextValue.current}>
      <GestureDetector gesture={panGesture}>
        <View ref={containerRef} collapsable={false} style={style} testID="view">
          {children}
        </View>
      </GestureDetector>
    </DndContext.Provider>
  );
});

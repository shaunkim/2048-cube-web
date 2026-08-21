import { fireEvent, render, screen } from '@testing-library/react-native';
import { Line } from 'react-native-svg';

import { TutorialScreen } from '../TutorialScreen';

const callbacks = () => ({
  onPageChange: jest.fn(),
  onCloseToMenu: jest.fn(),
  onPlay: jest.fn(),
});

it.each([
  [0, 'SWIPE IN SIX DIRECTIONS', 'Every swipe moves two faces of the cube.', 'tutorial-graphic-overview', ['Menu', 'Next']],
  [1, 'UP AND DOWN', 'Up and down move the Left and Right faces.', 'tutorial-graphic-up-down', ['Menu', 'Back', 'Next']],
  [2, 'UP-LEFT AND DOWN-RIGHT', 'This moves the Top and Left faces.', 'tutorial-graphic-up-left', ['Menu', 'Back', 'Next']],
  [3, 'UP-RIGHT AND DOWN-LEFT', 'This moves the Top and Right faces.', 'tutorial-graphic-up-right', ['Menu', 'Back', 'Next']],
  [4, 'MATCH AND MERGE', 'Equal tiles combine independently on both moving faces.', 'tutorial-graphic-merge', ['Menu', 'Back', 'Next']],
  [5, 'COMPLETE ALL THREE FACES', 'Reach 2048 or higher on every face. Then keep going!', 'tutorial-graphic-goal', ['Menu', 'Back', "Let's Play"]],
])('renders tutorial page %i with its original graphic and controls', (page, heading, body, graphic, controls) => {
  render(<TutorialScreen visible page={page} {...callbacks()} />);

  expect(screen.getByText(heading)).toBeTruthy();
  expect(screen.getByText(body)).toBeTruthy();
  expect(screen.getByTestId(graphic)).toBeTruthy();
  expect(screen.getAllByTestId(/tutorial-page-indicator-/)).toHaveLength(6);
  expect(screen.getByLabelText(`Page ${page + 1} of 6`)).toBeTruthy();
  expect(screen.getAllByRole('button').map((button) => button.props.accessibilityLabel)).toEqual(controls);
});

it('navigates next, back, to menu, and into gameplay', () => {
  const pageOne = callbacks();
  const first = render(<TutorialScreen visible page={0} {...pageOne} />);
  fireEvent.press(screen.getByRole('button', { name: 'Next' }));
  fireEvent.press(screen.getByRole('button', { name: 'Menu' }));
  expect(pageOne.onPageChange).toHaveBeenCalledWith(1);
  expect(pageOne.onCloseToMenu).toHaveBeenCalledTimes(1);
  first.unmount();

  const pageTwo = callbacks();
  const second = render(<TutorialScreen visible page={1} {...pageTwo} />);
  fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(pageTwo.onPageChange).toHaveBeenCalledWith(0);
  second.unmount();

  const pageSix = callbacks();
  render(<TutorialScreen visible page={5} {...pageSix} />);
  fireEvent.press(screen.getByRole('button', { name: "Let's Play" }));
  expect(pageSix.onPlay).toHaveBeenCalledTimes(1);
});

it('shows all six directions as white arrows on the first page', () => {
  render(<TutorialScreen visible page={0} {...callbacks()} />);

  for (const label of [
    'White up and down arrows on left face',
    'White up and down arrows on right face',
    'White up-left and down-right arrows on top face',
    'White up-left and down-right arrows on left face',
    'White up-right and down-left arrows on top face',
    'White up-right and down-left arrows on right face',
  ]) {
    expect(screen.getByLabelText(label)).toBeTruthy();
  }
});

it.each([
  [1, ['White up and down arrows on left face', 'White up and down arrows on right face']],
  [2, ['White up-left and down-right arrows on top face', 'White up-left and down-right arrows on left face']],
  [3, ['White up-right and down-left arrows on top face', 'White up-right and down-left arrows on right face']],
] as const)('explains the two affected faces on direction page %i', (page, label) => {
  render(<TutorialScreen visible page={page} {...callbacks()} />);
  label.forEach((arrowLabel) => expect(screen.getByLabelText(arrowLabel)).toBeTruthy());
});

it('orients the two top-face diagonal axes correctly', () => {
  const green = render(<TutorialScreen visible page={2} {...callbacks()} />);
  const greenLines = screen.getByTestId('tutorial-axis-up-left-top').findAllByType(Line);
  expect(greenLines.map((line: { readonly props: { readonly x1: number; readonly y1: number } }) => [line.props.x1, line.props.y1])).toEqual([[78, 78], [120, 105]]);
  green.unmount();

  render(<TutorialScreen visible page={3} {...callbacks()} />);
  const blueLines = screen.getByTestId('tutorial-axis-up-right-top').findAllByType(Line);
  expect(blueLines.map((line: { readonly props: { readonly x1: number; readonly y1: number } }) => [line.props.x1, line.props.y1])).toEqual([[120, 105], [162, 78]]);
});

it('shows vertically aligned upward merge examples without grayscale copy', () => {
  render(<TutorialScreen visible page={4} {...callbacks()} />);

  expect(screen.getByLabelText('Two plus two merges upward into four')).toBeTruthy();
  expect(screen.getByLabelText('Four plus four merges upward into eight')).toBeTruthy();
  expect(screen.queryByText('Frozen faces turn grayscale.')).toBeNull();
});

it('swipes left to advance and right to return without crossing page boundaries', () => {
  const firstPage = callbacks();
  const first = render(<TutorialScreen visible page={0} {...firstPage} />);
  fireEvent(screen.getByTestId('tutorial-swipe-area'), 'touchStart', { nativeEvent: { pageX: 220, pageY: 120 } });
  fireEvent(screen.getByTestId('tutorial-swipe-area'), 'touchEnd', { nativeEvent: { pageX: 120, pageY: 125 } });
  expect(firstPage.onPageChange).toHaveBeenCalledWith(1);
  first.unmount();

  const middlePage = callbacks();
  const middle = render(<TutorialScreen visible page={3} {...middlePage} />);
  fireEvent(screen.getByTestId('tutorial-swipe-area'), 'touchStart', { nativeEvent: { pageX: 100, pageY: 120 } });
  fireEvent(screen.getByTestId('tutorial-swipe-area'), 'touchEnd', { nativeEvent: { pageX: 190, pageY: 123 } });
  expect(middlePage.onPageChange).toHaveBeenCalledWith(2);
  middle.unmount();

  const lastPage = callbacks();
  render(<TutorialScreen visible page={5} {...lastPage} />);
  fireEvent(screen.getByTestId('tutorial-swipe-area'), 'touchStart', { nativeEvent: { pageX: 220, pageY: 120 } });
  fireEvent(screen.getByTestId('tutorial-swipe-area'), 'touchEnd', { nativeEvent: { pageX: 120, pageY: 125 } });
  expect(lastPage.onPageChange).not.toHaveBeenCalled();
});

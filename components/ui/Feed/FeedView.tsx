import React, {useEffect, useRef, useState} from "react";
import {ListingType, PostView, SortType} from "lemmy-js-client";
import {useTheme, useToast, View} from "native-base";
import {Button, RefreshControl, StyleSheet} from "react-native";
import FeedItem from "./FeedItem";
import LoadingView from "../Loading/LoadingView";
import {useActionSheet} from "@expo/react-native-action-sheet";
import {FlashList} from "@shopify/flash-list";
import SortIconType from "../../../types/SortIconType";
import sortIconType from "../../../types/SortIconType";
import CIconButton from "../CIconButton";
import FeedHeaderDropdownDrawer from "./FeedHeaderDropdownDrawer";
import {useAppDispatch, useAppSelector} from "../../../store";
import {selectFeed, setDropdownVisible} from "../../../slices/feed/feedSlice";
import {subscribeToCommunity} from "../../../slices/communities/communitiesActions";
import {isSubscribed} from "../../../lemmy/LemmyHelpers";
import {selectCommunities} from "../../../slices/communities/communitiesSlice";
import {useNavigation} from "@react-navigation/native";
import {trigger} from "react-native-haptic-feedback";
import {UseFeed} from "../../hooks/feeds/feedsHooks";
import LoadingFooter from "../Loading/LoadingFooter";
import LoadingErrorFooter from "../Loading/LoadingErrorFooter";
import {lemmyAuthToken, lemmyInstance} from "../../../lemmy/LemmyInstance";

interface FeedViewProps {
    feed: UseFeed;
    community?: boolean
}

const FeedView = (
    {
        feed,
        community = false,
    }: FeedViewProps) =>
{
    const navigation = useNavigation();

    const [endReached, setEndReached] = useState(false);
    const communityId = useRef(0);
    const communityName = useRef("");

    const toast = useToast();

    const [sortIcon, setSortIcon] = useState(SortIconType[feed.sort]);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => {
                if(dropdownVisible) {
                    return <Button title={"Cancel"} onPress={() => dispatch(setDropdownVisible())} />;
                }

                return (
                    <>
                        <CIconButton name={sortIconType[feed.sort]} onPress={onSortPress} />
                        <CIconButton name={"ellipsis-horizontal-outline"} onPress={onEllipsisButtonPress} />
                    </>
                );
            }
        });
    }, [feed.sort]);

    useEffect(() => {
        if(!feed.posts || communityId.current !== 0) return;
        communityId.current = feed.posts[0].community.id;
        communityName.current = feed.posts[0].community.name;
    }, [feed.posts]);

    const flashList = useRef<FlashList<any>>();

    const {dropdownVisible} = useAppSelector(selectFeed);
    const {subscribedCommunities} = useAppSelector(selectCommunities);

    const {showActionSheetWithOptions} = useActionSheet();
    const dispatch = useAppDispatch();
    const theme = useTheme();

    const feedItem = ({item}: {item: PostView}) => {
        return (
            <FeedItem post={item} />
        );
    };

    const onSortPress = () => {
        const options = ["Top Day", "Top Week", "Hot", "Active", "New", "Most Comments", "Cancel"];
        const cancelButtonIndex = 6;

        showActionSheetWithOptions({
            options,
            cancelButtonIndex
        }, (index: number) => {
            if(index === cancelButtonIndex) return;

            if(index === 0) {
                feed.setSort("TopDay");
            } else if(index === 1) {
                feed.setSort("TopWeek");
            } else if(index === 5) {
                feed.setSort("MostComments");
            } else {
                feed.setSort(options[index] as SortType);
            }

            setSortIcon(SortIconType[index]);
            flashList?.current?.scrollToOffset({animated: true, offset: 0});
        });
    };

    const onEllipsisButtonPress = () => {
        if(community) {
            const subscribed = isSubscribed(communityId.current, subscribedCommunities);

            const options = [subscribed ? "Unsubscribe" : "Subscribe", "Block Community", "Cancel"];
            const cancelButtonIndex = 2;

            showActionSheetWithOptions({
                options,
                cancelButtonIndex
            }, (index: number) => {
                if (index === cancelButtonIndex) return;

                if (index === 0) {
                    trigger("impactMedium");
                    toast.show({
                        title: `${!subscribed ? "Subscribed to" : "Unsubscribed from"} ${communityName.current}`,
                        duration: 3000
                    });

                    dispatch(subscribeToCommunity({
                        communityId: communityId.current,
                        subscribe: !subscribed
                    }));
                } else if(index === 1) {
                    trigger("impactMedium");
                    toast.show({
                        title: `Blocked ${communityName.current}`,
                        duration: 3000
                    });

                    lemmyInstance.blockCommunity({
                        auth: lemmyAuthToken,
                        community_id: communityId.current,
                        block: true
                    });
                }
            });
        } else {
            const options = ["All", "Local", "Subscribed", "Cancel"];
            const cancelButtonIndex = 3;

            showActionSheetWithOptions({
                options,
                cancelButtonIndex
            }, (index: number) => {
                if(index === cancelButtonIndex) return;

                feed.setListingType(options[index] as ListingType);
                flashList?.current?.scrollToOffset({animated: true, offset: 0});
            });
        }
    };

    const keyExtractor = (item) => item.post.id.toString();
    const refreshControl = <RefreshControl
        refreshing={feed.postsLoading}
        onRefresh={() => feed.doLoad(true)}
        tintColor={theme.colors.screen[300]}
    />;

    const footer = () => {
        if((feed.postsLoading && feed.posts.length > 0) || endReached) {
            return <LoadingFooter message={"Loading more posts..."} />;
        } else if(feed.postsError) {
            return <LoadingErrorFooter message={"Failed to load posts"} onRetryPress={feed.doLoad} />;
        }
    };

    return (
        <View style={styles.container} backgroundColor={"screen.900"}>
            <FeedHeaderDropdownDrawer />

            {
                feed.postsLoading && !feed.posts ? <LoadingView /> : (
                    <FlashList
                        data={feed.posts}
                        renderItem={feedItem}
                        keyExtractor={keyExtractor}
                        refreshControl={refreshControl}
                        onEndReachedThreshold={0.8}
                        estimatedItemSize={300}
                        estimatedListSize={{height: 50, width: 1}}
                        ListFooterComponent={footer}
                        onEndReached={() => setEndReached(true)}
                        ref={flashList}
                        onMomentumScrollEnd={() => {
                            if(endReached) {
                                feed.doLoad();
                                setEndReached(false);
                            }
                        }}
                    />
                )
            }
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
});

export default FeedView;